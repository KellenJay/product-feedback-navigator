import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { companyStore, useCompanies, type Company } from "./companyStore";
import { CompanyDialog } from "./CompanyDialog";
import { toast } from "sonner";

export function CompanySection({ userId }: { userId: string | null }) {
  const { companies, loaded } = useCompanies();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Company | null>(null);

  useEffect(() => {
    if (userId) void companyStore.hydrateForUser(userId);
  }, [userId]);

  return (
    <>
      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">My companies</h2>
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add company
        </Button>
      </div>
      <p className="mt-1 text-sm text-foreground-muted">
        Each company is a separate context for your projects.
      </p>

      <div className="mt-4 space-y-3">
        {!loaded && <div className="text-sm text-foreground-muted">Loading…</div>}
        {loaded && companies.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-surface/50 px-5 py-8 text-center">
            <p className="text-sm text-foreground-muted">No companies yet. Add your first one to get started.</p>
          </div>
        )}
        {companies.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.name}</span>
                  {c.is_active && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" /> Active
                    </Badge>
                  )}
                  {c.industry && <Badge variant="outline">{c.industry}</Badge>}
                  {c.stage && <Badge variant="outline">{c.stage}</Badge>}
                </div>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-foreground-muted">{c.description}</p>
                )}
                {c.website_url && (
                  <a
                    href={c.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-primary hover:underline"
                  >
                    {c.website_url}
                  </a>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!c.is_active && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void companyStore.setActive(c.id).then(() => toast.success(`${c.name} is active`))}
                  >
                    Set active
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setDialogOpen(true); }} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(c)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CompanyDialog open={dialogOpen} onOpenChange={setDialogOpen} company={editing} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDelete) {
                  await companyStore.remove(confirmDelete.id);
                  toast.success("Company deleted");
                  setConfirmDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
