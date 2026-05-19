import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  RotateCcw,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  buildPRDText,
  effortClasses,
  type PRD,
  type PRDEpic,
  type PRDExecutionPhase,
  type PRDUserStory,
} from "./prd";
import { priorityClasses } from "./roadmap";
import { exportPRDPdf } from "./exportPrdPdf";
import { usePRD } from "./prdStore";
import { prdQuestionStore, usePRDQuestions } from "./prdQuestionStore";
import type { RoadmapItem } from "./roadmap";
import { useEffect, useRef } from "react";

type Tab = "overview" | "epics" | "execution" | "metrics";

interface Props {
  productName: string;
  businessGoal: string;
  items: RoadmapItem[];
  executiveSummary: string;
}

export function PRDPanel({
  productName,
  businessGoal,
  items,
  executiveSummary,
}: Props) {
  const { prd, status, error, regenerate } = usePRD({
    productName,
    businessGoal,
    items,
    executiveSummary,
  });
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  const handleCopy = async () => {
    if (!prd) return;
    try {
      await navigator.clipboard.writeText(buildPRDText(prd));
      toast.success("PRD copied to clipboard");
    } catch {
      toast.error("Couldn't access clipboard");
    }
  };

  const handlePdf = () => {
    if (!prd) return;
    try {
      exportPRDPdf(prd, productName);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Couldn't export PDF");
    }
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Product Requirements Document
          </span>
          <span className="text-xs text-foreground-muted">·</span>
          <span className="text-xs font-medium text-foreground-muted">
            {prd?.version ?? "v1.0"}
          </span>
          <span className="text-xs text-foreground-muted">·</span>
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
            {prd?.status ?? "Draft"}
          </span>
          {status === "loading" && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-[11px] text-foreground-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Drafting PRD…
            </span>
          )}
          {status === "error" && (
            <span className="ml-2 text-[11px] text-destructive">
              {error ?? "Generation failed"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(status === "error" || prd) && (
            <button
              type="button"
              onClick={regenerate}
              disabled={status === "loading"}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {status === "error" ? "Retry" : "Regenerate"}
            </button>
          )}
          <button
            type="button"
            onClick={handlePdf}
            disabled={!prd}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface disabled:opacity-40"
          >
            <FileText className="h-3.5 w-3.5" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!prd}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface disabled:opacity-40"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              disabled={!prd}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {open ? (
                <>
                  Collapse <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  View full PRD <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent>
        {prd && (
          <div className="border-t border-border bg-background px-5 py-5">
            <PRDTabs tab={tab} onChange={setTab} />
            <div className="mt-5">
              {tab === "overview" && <Overview prd={prd} />}
              {tab === "epics" && <Epics epics={prd.epics} />}
              {tab === "execution" && <Execution phases={prd.executionGuide} />}
              {tab === "metrics" && (
                <Metrics
                  metrics={prd.successMetrics}
                  questions={prd.openQuestions}
                />
              )}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function PRDTabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const tabs: { value: Tab; label: string }[] = [
    { value: "overview", label: "Overview" },
    { value: "epics", label: "Epics & User Stories" },
    { value: "execution", label: "Execution Guide" },
    { value: "metrics", label: "Metrics & Questions" },
  ];
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-surface p-1">
      {tabs.map((t) => {
        const active = t.value === tab;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function Overview({ prd }: { prd: PRD }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{prd.title}</h2>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground-muted">
            {prd.version}
          </span>
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
            {prd.status}
          </span>
        </div>
      </div>
      <Section title="Overview">
        <p className="text-sm leading-7 text-foreground-muted">{prd.overview}</p>
      </Section>
      <Section title="Problem statement">
        <p className="text-sm leading-7 text-foreground-muted">
          {prd.problemStatement}
        </p>
      </Section>
      <Section title="Goals">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-7 text-foreground">
          {prd.goals.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ol>
      </Section>
      <Section title="Non-goals">
        <ul className="space-y-1.5 text-sm leading-7">
          {prd.nonGoals.map((g, i) => (
            <li
              key={i}
              className="text-foreground-muted line-through decoration-foreground-muted/40"
            >
              {g}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Epics({ epics }: { epics: PRDEpic[] }) {
  return (
    <div className="space-y-5">
      {epics.map((e) => (
        <EpicCard key={e.id} epic={e} />
      ))}
    </div>
  );
}

function EpicCard({ epic }: { epic: PRDEpic }) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {epic.id}
          </span>
          <h3 className="text-sm font-semibold text-foreground">
            {epic.title}
          </h3>
        </div>
        <p className="mt-1.5 text-[13px] leading-6 text-foreground-muted">
          {epic.description}
        </p>
        <p className="mt-1 text-[12px] leading-6 text-foreground">
          <span className="font-medium">Business value:</span>{" "}
          <span className="text-foreground-muted">{epic.businessValue}</span>
        </p>
      </div>
      <div className="divide-y divide-border">
        {epic.userStories.map((s) => (
          <StoryRow key={s.id} story={s} />
        ))}
      </div>
    </div>
  );
}

function StoryRow({ story }: { story: PRDUserStory }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="bg-background">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] font-semibold text-foreground-muted">
              {story.id}
            </span>
            <span className="text-[13px] font-medium text-foreground">
              {story.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${effortClasses(
                story.estimatedEffort,
              )}`}
              title={`Effort ${story.estimatedEffort}`}
            >
              Effort {story.estimatedEffort}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityClasses(
                story.priority,
              )}`}
            >
              {story.priority}
            </span>
            {open ? (
              <ChevronUp className="h-3.5 w-3.5 text-foreground-muted" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-foreground-muted" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 px-4 pb-4">
          <p className="italic text-[13px] leading-6 text-foreground-muted">
            {story.story}
          </p>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Acceptance criteria
            </p>
            <ul className="space-y-1.5">
              {story.acceptanceCriteria.map((ac, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-6 text-foreground">
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-3 w-3 flex-shrink-0 rounded-sm border border-border bg-background"
                  />
                  <span>{ac}</span>
                </li>
              ))}
            </ul>
          </div>
          {story.designNotes && (
            <Callout tone="blue" label="Design notes">
              {story.designNotes}
            </Callout>
          )}
          {story.devNotes && (
            <Callout tone="purple" label="Dev notes">
              {story.devNotes}
            </Callout>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Callout({
  tone,
  label,
  children,
}: {
  tone: "blue" | "purple";
  label: string;
  children: React.ReactNode;
}) {
  const cls =
    tone === "blue"
      ? "border-l-[3px] border-l-[hsl(210_90%_55%)] bg-[hsl(210_90%_55%/0.06)]"
      : "border-l-[3px] border-l-[hsl(270_70%_60%)] bg-[hsl(270_70%_60%/0.06)]";
  return (
    <div className={`rounded-r-md px-3 py-2 ${cls}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] leading-6 text-foreground">{children}</p>
    </div>
  );
}

function Execution({ phases }: { phases: PRDExecutionPhase[] }) {
  return (
    <div className="space-y-5">
      {phases.map((p, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">{p.phase}</h3>
            <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
              {p.sprint}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] leading-6 text-foreground-muted">
            <span className="font-medium text-foreground">Focus:</span> {p.focus}
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <PhaseList title="Tasks" items={p.tasks} />
            <PhaseList title="Dependencies" items={p.dependencies} />
            <PhaseList title="Risks" items={p.risks} />
          </div>
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                PM Recommendation
              </p>
            </div>
            <p className="mt-1.5 text-[13px] leading-6 text-foreground">
              {p.recommendedApproach}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhaseList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-[12px] text-foreground-muted">—</p>
      ) : (
        <ul className="space-y-1 text-[12px] leading-6 text-foreground">
          {items.map((it, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-foreground-muted">•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metrics({
  metrics,
  questions,
}: {
  metrics: string[];
  questions: string[];
}) {
  return (
    <div className="space-y-6">
      <Section title="Success metrics">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                  #
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                  Metric
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                  Target
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.map((m, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-[12px] text-foreground-muted">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 text-[13px] leading-6 text-foreground">
                    {m}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-foreground-muted">
                    <input
                      type="text"
                      placeholder="Set target"
                      className="w-full rounded border border-border bg-background px-2 py-1 text-[12px] text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Open questions">
        <ul className="space-y-2">
          {questions.map((q, i) => (
            <OpenQuestionRow key={i} question={q} />
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}

function OpenQuestionRow({ question }: { question: string }) {
  const map = usePRDQuestions();
  const state = map[question] ?? { answer: "", resolved: false };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onAnswerChange = (v: string) => {
    if (timer.current) clearTimeout(timer.current);
    // optimistic local: rely on store as source of truth, just debounce writes
    timer.current = setTimeout(() => {
      prdQuestionStore.setAnswer(question, v);
    }, 300);
    // write immediately too so UI stays in sync without debounce flicker
    prdQuestionStore.setAnswer(question, v);
  };

  return (
    <li
      className={`rounded-lg border border-border bg-surface px-3 py-2 ${
        state.resolved ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`text-[13px] leading-6 text-foreground ${
            state.resolved ? "line-through" : ""
          }`}
        >
          {question}
        </span>
        <button
          type="button"
          onClick={() => prdQuestionStore.setResolved(question, !state.resolved)}
          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
            state.resolved
              ? "bg-success/15 text-success hover:bg-success/25"
              : "bg-warning/15 text-warning hover:bg-warning/25"
          }`}
        >
          {state.resolved ? "Resolved" : "Unresolved"}
        </button>
      </div>
      <textarea
        value={state.answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Add your answer or comment…"
        rows={2}
        className="mt-2 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] leading-5 text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </li>
  );
}
