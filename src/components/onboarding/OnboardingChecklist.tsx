import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { onboardingStore, useOnboarding } from "./onboardingStore";
import { analyzeStore } from "@/components/insightflow/analyzeStore";
import { libraryStore } from "@/components/insightflow/libraryStore";

const STEPS: Array<{
  key: "analyze" | "roadmap" | "library";
  title: string;
  desc: string;
  cta: string;
  to: "/app" | "/roadmap" | "/library";
}> = [
  { key: "analyze", title: "Run your first analysis", desc: "Paste feedback or upload a doc — we'll cluster pain points.", cta: "Open Analyze", to: "/app" },
  { key: "roadmap", title: "Open the Roadmap", desc: "See pain points sliced into a shippable roadmap.", cta: "Open Roadmap", to: "/roadmap" },
  { key: "library", title: "Save to your Library", desc: "Keep analyses for later — they auto-save here.", cta: "Open Library", to: "/library" },
];

export function OnboardingChecklist() {
  const ob = useOnboarding();
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Auto-complete steps by observing app state.
  useEffect(() => {
    if (!ob.loaded || !ob.userId) return;
    if (path.startsWith("/roadmap")) onboardingStore.markStep("roadmap");
    if (path.startsWith("/library")) onboardingStore.markStep("library");
  }, [path, ob.loaded, ob.userId]);

  useEffect(() => {
    if (!ob.loaded || !ob.userId) return;
    // Analyze: any time result becomes non-null.
    const checkAnalyze = () => {
      if (analyzeStore.get().result) onboardingStore.markStep("analyze");
    };
    const checkLib = () => {
      if (libraryStore.get().entries.length > 0) onboardingStore.markStep("library");
    };
    checkAnalyze();
    checkLib();
    const unsubA = analyzeStore.subscribe?.(checkAnalyze);
    const unsubL = libraryStore.subscribe?.(checkLib);
    return () => { unsubA?.(); unsubL?.(); };
  }, [ob.loaded, ob.userId]);

  // Don't show until survey is dealt with, on auth pages, or if dismissed.
  const showSurveyFirst = ob.loaded && ob.userId && !ob.survey.completed && !ob.survey.skipped;
  if (!ob.loaded || !ob.userId || ob.checklist.dismissed || showSurveyFirst) return null;
  if (path === "/login" || path === "/" || path.startsWith("/auth")) return null;

  const done = STEPS.filter((s) => ob.checklist[s.key]).length;
  const total = STEPS.length;
  const allDone = done === total;
  const collapsed = ob.checklist.collapsed;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[300px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-lg">
      <button
        type="button"
        onClick={() => onboardingStore.toggleCollapsed()}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">
            {allDone ? "🎉 You're all set" : "Get started"}
          </div>
          <div className="text-xs text-foreground-muted">{done} of {total} complete</div>
        </div>
        <div className="flex items-center gap-1">
          {allDone && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onboardingStore.dismissChecklist(); }}
              onKeyDown={(e) => { if (e.key === "Enter") onboardingStore.dismissChecklist(); }}
              className="rounded p-1 text-foreground-muted hover:bg-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </span>
          )}
          {collapsed ? <ChevronUp className="h-4 w-4 text-foreground-muted" /> : <ChevronDown className="h-4 w-4 text-foreground-muted" />}
        </div>
      </button>

      {!collapsed && (
        <ul className="space-y-2 border-t border-border px-4 py-3">
          {STEPS.map((s) => {
            const isDone = ob.checklist[s.key];
            return (
              <li key={s.key} className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isDone ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {isDone && <Check className="h-3 w-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm ${isDone ? "text-foreground-muted line-through" : "text-foreground"}`}>{s.title}</div>
                  {!isDone && (
                    <>
                      <div className="text-xs text-foreground-muted">{s.desc}</div>
                      <Link to={s.to} className="mt-1 inline-block text-xs font-medium text-primary hover:underline">
                        {s.cta} →
                      </Link>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
