import { Info, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AnalysisResult, Quote, Sentiment } from "./types";

interface Props {
  result: AnalysisResult;
  productName: string;
}

const sentimentClasses: Record<Sentiment, string> = {
  Negative: "text-destructive",
  Mixed: "text-warning",
  Positive: "text-success",
};

function normalizeQuote(q: Quote): {
  text: string;
  source?: string | null;
  context?: string | null;
  date?: string | null;
  url?: string | null;
} {
  if (typeof q === "string") return { text: q };
  return q;
}

export function ResultsView({ result }: Props) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
        {/* 3a — Metrics */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Reviews analyzed" value={String(result.reviewsAnalyzed)} />
          <Metric
            label="Overall sentiment"
            value={result.overallSentiment}
            valueClassName={sentimentClasses[result.overallSentiment]}
          />
          <Metric
            label="Critical issues"
            value={String(result.criticalIssuesCount)}
            valueClassName="text-destructive"
          />
          <Metric label="Top pain area" value={result.topPainArea} />
        </div>

        {/* 3b — Executive summary */}
        <section className="mt-5 rounded-xl border border-border bg-card p-5">
          <SectionLabel>Executive summary</SectionLabel>
          <p className="mt-2 text-[14px] leading-7 text-foreground">
            {result.executiveSummary}
          </p>
        </section>

        {/* 3c — Issues */}
        <section className="mt-5">
          <div className="flex items-center gap-1.5">
            <SectionLabel>Prioritized pain points</SectionLabel>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="What do P1, P2, P3 mean?"
                  className="rounded-full p-0.5 text-foreground-muted transition-colors hover:text-foreground"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-[260px] bg-card text-card-foreground border border-border p-3 text-left"
              >
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
                  Priority levels
                </p>
                <ul className="space-y-1.5 text-[12px] leading-5">
                  <li>
                    <span className="font-medium text-destructive">P1 — Critical.</span>{" "}
                    Blocks core use or causes churn. Fix this sprint.
                  </li>
                  <li>
                    <span className="font-medium text-warning">P2 — High.</span>{" "}
                    Significant friction for many users. Next 1–2 sprints.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">P3 — Medium.</span>{" "}
                    Quality-of-life improvement. Backlog candidate.
                  </li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-3 space-y-3">
            {result.issues.map((issue, i) => {
              const rank = i + 1;
              const topThree = rank <= 3;
              const impactColor =
                issue.impactScore >= 70
                  ? "bg-success/15 text-success"
                  : issue.impactScore >= 40
                    ? "bg-warning/15 text-warning"
                    : "bg-muted text-foreground-muted";
              return (
                <article
                  key={`${issue.title}-${i}`}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        topThree
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[15px] font-medium text-foreground">
                          {issue.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${impactColor}`}
                        >
                          Impact {issue.impactScore}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Tag tone="info">{issue.category}</Tag>
                        <PriorityTag priority={issue.priority} />
                        <Tag tone="muted">{issue.mentions} mentions</Tag>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-foreground-muted">
                        {issue.description}
                      </p>
                      {issue.quotes && issue.quotes.length > 0 && (
                        <div className="mt-3 space-y-2.5 rounded-md border border-border bg-surface p-3">
                          {issue.quotes.slice(0, 2).map((raw, qi) => {
                            const q = normalizeQuote(raw);
                            const attrParts = [q.source, q.context, q.date]
                              .filter(Boolean) as string[];
                            return (
                              <div key={qi} className="space-y-1">
                                <p className="text-[12px] italic leading-5 text-foreground">
                                  “{q.text}”
                                </p>
                                {(attrParts.length > 0 || q.url) && (
                                  <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
                                    {attrParts.length > 0 && (
                                      <span>— {attrParts.join(" · ")}</span>
                                    )}
                                    {q.url && (
                                      <a
                                        href={q.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-0.5 font-medium text-accent hover:underline"
                                      >
                                        View source
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 3d — Recommendations */}
        {result.recommendations?.length > 0 && (
          <section className="mt-5 rounded-xl bg-surface p-5">
            <h2 className="text-sm font-medium text-foreground">
              Top recommendations
            </h2>
            <ol className="mt-3 space-y-3">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-medium text-background">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium text-foreground">{rec.title}.</span>{" "}
                    <span className="text-foreground-muted">{rec.detail}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

      </div>
    </TooltipProvider>
  );
}

function Metric({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[12px] text-foreground-muted">{label}</p>
      <p
        className={`mt-1 text-[22px] font-medium leading-tight ${
          valueClassName ?? "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
      {children}
    </h2>
  );
}

function Tag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "info" | "muted";
}) {
  const cls =
    tone === "info"
      ? "bg-accent/15 text-accent"
      : "bg-muted text-foreground-muted";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

function PriorityTag({ priority }: { priority: "P1" | "P2" | "P3" }) {
  const cls =
    priority === "P1"
      ? "bg-destructive/15 text-destructive"
      : priority === "P2"
        ? "bg-warning/15 text-warning"
        : "bg-muted text-foreground-muted";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {priority}
    </span>
  );
}

