import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { CheckCircle2, Circle, X, Sparkles, Copy } from "lucide-react";
import { checklistStore, useChecklist, type ChecklistKey } from "./checklistStore";
import { useAnalyzeStore } from "@/components/insightflow/analyzeStore";
import { useLibrary } from "@/components/insightflow/libraryStore";
import { toast } from "sonner";

const ITEMS: Array<{ key: ChecklistKey; title: string }> = [
  { key: "account_created", title: "Create your account" },
  { key: "profile_completed", title: "Complete your profile" },
  { key: "company_added", title: "Add your first company" },
  { key: "first_analysis", title: "Run your first analysis" },
  { key: "first_roadmap", title: "Generate your first roadmap" },
  { key: "first_library_save", title: "Save a project to your library" },
];

export function ChecklistLauncher() {
  const cl = useChecklist();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [analyze] = useAnalyzeStore();
  const lib = useLibrary();

  // Auto-mark from app state
  useEffect(() => {
    if (!cl.loaded || !cl.userId) return;
    if (analyze.result) void checklistStore.mark("first_analysis");
  }, [analyze.result, cl.loaded, cl.userId]);

  useEffect(() => {
    if (!cl.loaded || !cl.userId) return;
    if (path.startsWith("/roadmap") && analyze.result) void checklistStore.mark("first_roadmap");
  }, [path, analyze.result, cl.loaded, cl.userId]);

  useEffect(() => {
    if (!cl.loaded || !cl.userId) return;
    if (lib.entries.some((e) => e.saved)) void checklistStore.mark("first_library_save");
  }, [lib.entries, cl.loaded, cl.userId]);

  const hiddenPath =
    path === "/login" ||
    path === "/" ||
    path === "/onboarding" ||
    path.startsWith("/auth") ||
    path.startsWith("/reset-password");

  if (!cl.loaded || !cl.userId || cl.row.dismissed || hiddenPath) return null;

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[320px] max-w-[calc(100vw-2rem)]">
      {cl.open && (
        <div className="mb-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-semibold text-foreground">Get started</div>
            <button
              onClick={() => checklistStore.toggleOpen()}
              className="rounded p-1 text-foreground-muted hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {cl.allDone ? (
            <div className="px-4 py-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                You've completed the InsightFlow basics.
              </div>
              <p className="mt-2 text-xs text-foreground-muted">
                You know how to go from raw feedback to a team-ready roadmap.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => void checklistStore.dismiss()}
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Dismiss
                </button>
                <button
                  onClick={copyShare}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Copy className="h-3 w-3" /> Share InsightFlow
                </button>
              </div>
            </div>
          ) : (
            <ul className="space-y-1 px-2 py-2">
              {ITEMS.map((item) => {
                const done = cl.row[item.key];
                return (
                  <li key={item.key} className="flex items-center gap-3 px-2 py-1.5">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-foreground-muted" />
                    )}
                    <span className={`text-sm ${done ? "text-foreground-muted line-through" : "text-foreground"}`}>
                      {item.title}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      <button
        onClick={() => checklistStore.toggleOpen()}
        className="flex w-full items-center justify-between gap-3 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-lg hover:bg-muted"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Onboarding
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {cl.doneCount}/{cl.total}
        </span>
      </button>
    </div>
  );
}
