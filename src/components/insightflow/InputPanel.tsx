import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Upload, Search, X, Sparkles, Loader2 } from "lucide-react";
import type { SourceMode } from "./types";

interface Props {
  productName: string;
  setProductName: (v: string) => void;
  businessGoal: string;
  setBusinessGoal: (v: string) => void;
  mode: SourceMode;
  setMode: (m: SourceMode) => void;
  pastedFeedback: string;
  setPastedFeedback: (v: string) => void;
  uploadedFile: { name: string; content: string } | null;
  setUploadedFile: (f: { name: string; content: string } | null) => void;
  researchQuery: string;
  setResearchQuery: (v: string) => void;
  loading: boolean;
  onAnalyze: () => void;
}

const modes: { id: SourceMode; label: string; icon: typeof FileText }[] = [
  { id: "paste", label: "Paste feedback", icon: FileText },
  { id: "upload", label: "Upload document", icon: Upload },
  { id: "deep-research", label: "Deep research", icon: Search },
];

export function InputPanel(props: Props) {
  const {
    productName,
    setProductName,
    businessGoal,
    setBusinessGoal,
    mode,
    setMode,
    pastedFeedback,
    setPastedFeedback,
    uploadedFile,
    setUploadedFile,
    researchQuery,
    setResearchQuery,
    loading,
    onAnalyze,
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);

  const MAX_CHARS = 200_000;

  const finish = (name: string, raw: string) => {
    const trimmed = raw.replace(/\s+\n/g, "\n").trim();
    if (!trimmed) {
      toast.error("No readable text found", {
        description:
          "The document may be a scanned image. Try a text-based PDF or paste the feedback.",
      });
      return;
    }
    const content =
      trimmed.length > MAX_CHARS ? trimmed.slice(0, MAX_CHARS) : trimmed;
    setUploadedFile({ name, content });
    if (trimmed.length > MAX_CHARS) {
      toast("Document trimmed", {
        description: `Using the first ${(MAX_CHARS / 1000).toFixed(0)}k characters.`,
      });
    }
  };

  const readPdf = async (file: File) => {
    const pdfjs: any = await import("pdfjs-dist");
    const workerSrc = (
      await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
    ).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text +=
        content.items.map((it: any) => ("str" in it ? it.str : "")).join(" ") +
        "\n\n";
    }
    return text;
  };

  const readDocx = async (file: File) => {
    const mammoth: any = await import("mammoth/mammoth.browser");
    const buf = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return value as string;
  };

  const readFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["txt", "csv", "pdf", "docx", "md"].includes(ext)) {
      if (ext === "doc") {
        toast.error("Legacy .doc not supported", {
          description: "Save as .docx or .pdf and re-upload.",
        });
      } else {
        toast.error("Unsupported file type", {
          description: "Use .txt, .csv, .pdf, or .docx",
        });
      }
      return;
    }

    setParsing(true);
    try {
      if (ext === "pdf") {
        const text = await readPdf(file);
        finish(file.name, text);
      } else if (ext === "docx") {
        const text = await readDocx(file);
        finish(file.name, text);
      } else {
        const text = await file.text();
        finish(file.name, text);
      }
    } catch (e) {
      console.error("File parse error:", e);
      toast.error("Could not read file", {
        description:
          e instanceof Error ? e.message : "Try a different file format.",
      });
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  return (
    <div className="card-halo rounded-2xl border border-border bg-surface p-6">
      {/* Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Product name">
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. GoDaddy Managed WordPress"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </Field>
        <Field label="Business goal (optional)">
          <input
            value={businessGoal}
            onChange={(e) => setBusinessGoal(e.target.value)}
            placeholder="e.g. reduce churn, improve onboarding"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </Field>
      </div>

      {/* Row 2 — selector */}
      <div className="mt-5">
        <p className="mb-2 text-sm text-foreground">
          How would you like to provide feedback?
        </p>
        <div className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-background p-1">
          {modes.map(({ id, label, icon: Icon }) => {
            const isActive = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3 — dynamic input */}
      <div className="mt-4">
        {mode === "paste" && (
          <textarea
            value={pastedFeedback}
            onChange={(e) => setPastedFeedback(e.target.value)}
            placeholder="Paste user reviews, Reddit posts, Capterra reviews, support tickets, forum threads…"
            className="block w-full resize-y rounded-md border border-border bg-background p-3 text-sm leading-relaxed text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            style={{ height: 140 }}
          />
        )}

        {mode === "upload" && (
          <div>
            {!uploadedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex h-[140px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-background text-sm text-foreground-muted transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                <Upload className="mb-2 h-5 w-5" />
                <span>Drag a file here or click to browse</span>
                <span className="mt-1 text-xs">.txt, .pdf, .docx, .csv</span>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2.5 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-foreground">
                    {uploadedFile.name}
                  </span>
                  <span className="shrink-0 text-xs text-foreground-muted">
                    {(uploadedFile.content.length / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="rounded p-1 text-foreground-muted hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {mode === "deep-research" && (
          <div>
            <Field label="What should we research?">
              <input
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                placeholder="e.g. GoDaddy Managed WordPress reviews on Reddit, G2, Capterra"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <p className="mt-2 text-xs text-foreground-muted">
              InsightFlow will use AI to gather and synthesize known feedback
              themes for this product.
            </p>
          </div>
        )}
      </div>

      {/* Row 4 — CTA */}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={loading}
        className="btn-glow mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing with AI…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Analyze feedback
          </>
        )}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
