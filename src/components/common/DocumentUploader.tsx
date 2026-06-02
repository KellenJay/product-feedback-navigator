import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Upload, FileText, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface UploadedDoc {
  id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
  created_at: string;
}

export type DocScope =
  | { kind: "company"; companyId: string; userId: string }
  | { kind: "feature"; requestId: string; userId: string };

interface Props {
  scope: DocScope;
  label?: string;
  maxFiles?: number;
  maxSizeMb?: number;
  onChange?: (docs: UploadedDoc[]) => void;
}

const BUCKET = "company-docs";

function pathFor(scope: DocScope, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uid = crypto.randomUUID();
  if (scope.kind === "company") {
    return `${scope.userId}/${scope.companyId}/${uid}-${safe}`;
  }
  return `${scope.userId}/feature-ideas/${scope.requestId}/${uid}-${safe}`;
}

function table(scope: DocScope): "company_documents" | "feature_idea_documents" {
  return scope.kind === "company" ? "company_documents" : "feature_idea_documents";
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentUploader({
  scope,
  label = "Documents",
  maxFiles = 10,
  maxSizeMb = 20,
  onChange,
}: Props) {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const query =
      scope.kind === "company"
        ? supabase.from("company_documents").select("*").eq("company_id", scope.companyId)
        : supabase
            .from("feature_idea_documents")
            .select("*")
            .eq("request_id", scope.requestId);
    const { data, error } = await query.order("created_at", { ascending: true });
    if (error) {
      toast.error("Couldn't load documents", { description: error.message });
    } else {
      const list = (data ?? []) as UploadedDoc[];
      setDocs(list);
      onChange?.(list);
    }
    setLoading(false);
  }, [scope, onChange]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.kind, scope.kind === "company" ? scope.companyId : scope.requestId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxFiles - docs.length;
    if (remaining <= 0) {
      toast.error(`Limit reached`, { description: `Max ${maxFiles} files.` });
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`Only ${remaining} more file${remaining === 1 ? "" : "s"} allowed`);
    }
    setUploading(true);
    try {
      for (const file of toUpload) {
        if (file.size > maxSizeMb * 1024 * 1024) {
          toast.error(`${file.name} is too large`, { description: `Max ${maxSizeMb} MB.` });
          continue;
        }
        const storagePath = pathFor(scope, file.name);
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
        if (upErr) {
          toast.error(`Upload failed: ${file.name}`, { description: upErr.message });
          continue;
        }
        const common = {
          user_id: scope.userId,
          storage_path: storagePath,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
        };
        const insErr =
          scope.kind === "company"
            ? (
                await supabase
                  .from("company_documents")
                  .insert({ ...common, company_id: scope.companyId })
              ).error
            : (
                await supabase
                  .from("feature_idea_documents")
                  .insert({ ...common, request_id: scope.requestId })
              ).error;
        if (insErr) {
          await supabase.storage.from(BUCKET).remove([storagePath]);
          toast.error(`Couldn't save ${file.name}`, { description: insErr.message });
        }
      }
      await load();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async (doc: UploadedDoc) => {
    const ok = window.confirm(`Delete ${doc.file_name}?`);
    if (!ok) return;
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    const { error } = await supabase.from(table(scope)).delete().eq("id", doc.id);
    if (error) {
      toast.error("Couldn't delete", { description: error.message });
      return;
    }
    await load();
  };

  const handleDownload = async (doc: UploadedDoc) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, 60);
    if (error || !data?.signedUrl) {
      toast.error("Couldn't open file", { description: error?.message });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const atLimit = docs.length >= maxFiles;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground-muted">{label}</span>
        <span className="text-[11px] text-foreground-muted">
          {docs.length}/{maxFiles}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || atLimit}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background text-sm text-foreground-muted transition-colors hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
          </>
        ) : atLimit ? (
          <>Limit reached ({maxFiles})</>
        ) : (
          <>
            <Upload className="h-4 w-4" /> Upload documents
          </>
        )}
      </button>
      <div className="mt-2 space-y-1.5">
        {loading && docs.length === 0 ? (
          <p className="text-[11px] text-foreground-muted">Loading…</p>
        ) : docs.length === 0 ? (
          <p className="text-[11px] text-foreground-muted">
            No documents yet. PDFs, images, Word docs, text — up to {maxSizeMb} MB each.
          </p>
        ) : (
          docs.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5"
            >
              <FileText className="h-4 w-4 shrink-0 text-foreground-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-foreground">{d.file_name}</p>
                <p className="text-[10px] text-foreground-muted">{formatSize(d.size_bytes)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(d)}
                title="Download"
                className="rounded p-1 text-foreground-muted hover:text-foreground"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(d)}
                title="Delete"
                className="rounded p-1 text-foreground-muted hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
