import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { checklistStore, useChecklist, type ChecklistKey } from "./checklistStore";
import { useAnalyzeStore } from "@/components/insightflow/analyzeStore";
import { useLibrary } from "@/components/insightflow/libraryStore";

type StepDef = {
  key: ChecklistKey;
  label: string;
  description: string;
  action?: { label: string; to: "/app" | "/roadmap" | "/library" | "/account" };
};

const STEPS: StepDef[] = [
  {
    key: "account_created",
    label: "Account",
    description: "Your account is set up — you're signed in and ready to go.",
  },
  {
    key: "profile_completed",
    label: "Profile",
    description: "Add your name, photo, and role so your workspace feels like yours.",
    action: { label: "Edit profile", to: "/account" },
  },
  {
    key: "company_added",
    label: "Company",
    description: "Add the product or company you're working on so analyses and roadmaps stay organized.",
    action: { label: "Add a company", to: "/account" },
  },
  {
    key: "first_analysis",
    label: "Analysis",
    description: "Paste reviews, transcripts, or notes and turn them into themes, pains, and feature ideas.",
    action: { label: "Open Analyze", to: "/app" },
  },
  {
    key: "first_roadmap",
    label: "Roadmap",
    description: "Generate a prioritized roadmap with epics and user stories from your analysis.",
    action: { label: "Open Roadmap", to: "/roadmap" },
  },
  {
    key: "first_library_save",
    label: "Library",
    description: "Save analyses to your library so you can come back to them anytime.",
    action: { label: "Open Library", to: "/library" },
  },
];

export function OnboardingStrip() {
  const cl = useChecklist();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [analyze] = useAnalyzeStore();
  const lib = useLibrary();
  const [openKey, setOpenKey] = useState<ChecklistKey | null>(null);

  // Auto-mark from app state (moved from former ChecklistLauncher)
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

  if (!cl.loaded || !cl.userId || cl.allDone || cl.row.dismissed) return null;

  // Find the next undone step for subtle ring highlight
  const nextKey = STEPS.find((s) => !cl.row[s.key])?.key;

  return (
    <div className="border-y border-primary/20 bg-primary/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
      <div className="mx-auto flex max-w-[780px] items-center gap-3 px-4 py-2 sm:px-6">
        <div className="no-scrollbar -mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1">
          {STEPS.map((step) => {
            const done = cl.row[step.key];
            const isNext = step.key === nextKey;
            return (
              <Popover
                key={step.key}
                open={openKey === step.key}
                onOpenChange={(o) => setOpenKey(o ? step.key : null)}
              >
                <PopoverTrigger asChild>
                  <button
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                      done
                        ? "border-emerald-500/30 bg-emerald-500/10 text-foreground-muted"
                        : isNext
                          ? "border-primary/40 bg-primary/5 text-foreground ring-1 ring-primary/30 hover:bg-primary/10"
                          : "border-border bg-surface text-foreground hover:bg-muted"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-foreground-muted" />
                    )}
                    <span className={done ? "line-through" : ""}>{step.label}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-foreground-muted" />
                    )}
                    {step.label}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-foreground-muted">
                    {step.description}
                  </p>
                  {step.action && (
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => {
                        setOpenKey(null);
                        navigate({ to: step.action!.to });
                      }}
                    >
                      {step.action.label}
                    </Button>
                  )}
                  {!step.action && done && (
                    <div className="mt-3 text-xs text-foreground-muted">Done</div>
                  )}
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
        <div className="shrink-0 text-xs text-foreground-muted">
          {cl.doneCount} / {cl.total}
        </div>
      </div>
    </div>
  );
}
