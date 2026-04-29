import { toast } from "sonner";
import type { AnalysisResult, Sentiment } from "./types";

interface Props {
  result: AnalysisResult;
  productName: string;
}

const sentimentClasses: Record<Sentiment, string> = {
  Negative: "text-destructive",
  Mixed: "text-warning",
  Positive: "text-success",
};

export function ResultsView({ result, productName }: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
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
        <SectionLabel>Prioritized pain points</SectionLabel>
        <div className="mt-3 space-y-3">
          {result.issues.map((issue, i) => {
            const rank = i + 1;
            const topThree = rank <= 3;
            const impactColor =
              issue.impactScore >= 70
                ? "bg-success/10 text-success"
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
                      <Tag tone="muted">{issue.priority}</Tag>
                      <Tag tone="muted">{issue.mentions} mentions</Tag>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-foreground-muted">
                      {issue.description}
                    </p>
                    {issue.quotes && issue.quotes.length > 0 && (
                      <div className="mt-3 space-y-1.5 rounded-md border border-border bg-surface p-3">
                        {issue.quotes.slice(0, 2).map((q, qi) => (
                          <p
                            key={qi}
                            className="text-[12px] italic leading-5 text-foreground-muted"
                          >
                            “{q}”
                          </p>
                        ))}
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

      {/* Section 4 — Save / Export */}
      <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
        <p className="text-xs text-foreground-muted">
          Analysis complete — {productName || "Untitled"} · {today}
        </p>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast("Coming in next build")}>
            Save to library
          </SecondaryButton>
          <SecondaryButton onClick={() => toast("Coming in next build")}>
            Export as PDF
          </SecondaryButton>
        </div>
      </div>
    </div>
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
      ? "bg-accent text-accent-foreground"
      : "bg-muted text-foreground-muted";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
    >
      {children}
    </button>
  );
}
