import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketContext } from "./types";

interface Props {
  productName: string;
  businessGoal: string;
  topPainPoints: { title: string; impactScore: number }[];
}

export function MarketContextPanel({
  productName,
  businessGoal,
  topPainPoints,
}: Props) {
  const [data, setData] = useState<MarketContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setShowReasoning(false);

    (async () => {
      try {
        const { data: res, error: fnErr } = await supabase.functions.invoke(
          "market-context",
          { body: { productName, businessGoal, topPainPoints } },
        );

        if (cancelled) return;

        if (fnErr) {
          const msg = (fnErr as { message?: string })?.message ?? "Failed";
          if (msg.includes("429")) {
            toast.error("Rate limited", {
              description: "Too many requests. Try again in a moment.",
            });
          } else if (msg.includes("402")) {
            toast.error("AI credits exhausted", {
              description: "Add credits in your workspace to continue.",
            });
          }
          setError(msg);
          return;
        }
        if ((res as { error?: string })?.error) {
          setError((res as { error: string }).error);
          return;
        }
        setData(res as MarketContext);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return (
    <section className="mt-5 animate-in fade-in slide-in-from-bottom-3 duration-500 rounded-xl border border-border bg-card p-5">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
        Market context
        <span className="text-foreground-muted/60"> · Auto-generated based on your analysis</span>
      </h2>

      {loading && <LoadingState />}

      {!loading && error && (
        <div className="mt-4 flex items-start gap-3 rounded-md border border-border bg-surface p-3 text-[13px]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-foreground">Couldn't load market context.</p>
            <p className="mt-0.5 text-foreground-muted">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:bg-surface"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {!loading && data && (
        <div className="mt-4 space-y-6">
          {/* Trends */}
          {data.trends?.length > 0 && (
            <div>
              <SubLabel>Trend signals</SubLabel>
              <ul className="mt-2 space-y-2.5">
                {data.trends.map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <DirectionGlyph direction={t.direction} />
                    <div className="flex-1">
                      <p className="text-[14px] leading-6 text-foreground">
                        {t.statement}
                      </p>
                      <p className="mt-0.5 text-[11px] text-foreground-muted">
                        {t.source}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Competitors */}
          {data.competitors?.length > 0 && (
            <div>
              <SubLabel>Competitive landscape</SubLabel>
              <div className="mt-2">
                {data.competitors.map((c, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[110px_1fr_110px] items-start gap-3 border-b border-border/50 py-2.5 text-[13px] last:border-b-0"
                  >
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-foreground-muted">{c.approach}</span>
                    <span className="inline-flex items-center gap-2 text-foreground">
                      <SignalDot signal={c.signal} />
                      {c.signal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* News */}
          {data.news?.length > 0 && (
            <div>
              <SubLabel>Industry news · Last 90 days</SubLabel>
              <ul className="mt-2">
                {data.news.map((n, i) => (
                  <li
                    key={i}
                    className="border-b border-border/50 py-2.5 last:border-b-0"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] font-medium text-foreground">
                        {n.headline}
                      </p>
                      <p className="shrink-0 text-[11px] text-foreground-muted">
                        {n.source} · {n.date}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-6 text-foreground-muted">
                      {n.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Market sizing */}
          {data.marketSize?.confident && data.marketSize.statement && (
            <div className="rounded-md bg-surface px-3 py-2 text-[13px] text-foreground-muted">
              {data.marketSize.statement}
            </div>
          )}

          {/* Verdict */}
          {data.verdict && <VerdictCard
            verdict={data.verdict}
            showReasoning={showReasoning}
            onToggle={() => setShowReasoning((s) => !s)}
          />}
        </div>
      )}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="mt-4">
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-4 w-[72%]" />
      </div>
      <p className="mt-3 text-[13px] text-foreground-muted">
        Pulling market signals, competitor activity, and industry trends…
      </p>
      <p className="mt-1 text-[11px] text-foreground-muted/70">
        Synthesized from AI training data
      </p>
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
      {children}
    </h3>
  );
}

function DirectionGlyph({
  direction,
}: {
  direction: "growing" | "stable" | "declining";
}) {
  const map = {
    growing: { ch: "▲", cls: "text-warning" },
    stable: { ch: "→", cls: "text-primary" },
    declining: { ch: "▼", cls: "text-foreground-muted" },
  } as const;
  const { ch, cls } = map[direction];
  return (
    <span
      aria-hidden
      className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center text-[11px] leading-none ${cls}`}
    >
      {ch}
    </span>
  );
}

function SignalDot({ signal }: { signal: "Ahead" | "Watching" | "Lagging" }) {
  const cls =
    signal === "Ahead"
      ? "bg-success"
      : signal === "Watching"
        ? "bg-warning"
        : "bg-destructive";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} aria-hidden />;
}

function VerdictCard({
  verdict,
  showReasoning,
  onToggle,
}: {
  verdict: MarketContext["verdict"];
  showReasoning: boolean;
  onToggle: () => void;
}) {
  const tone =
    verdict.outcome === "validates"
      ? { border: "border-l-success", text: "text-success" }
      : verdict.outcome === "contradicts"
        ? { border: "border-l-destructive", text: "text-destructive" }
        : { border: "border-l-warning", text: "text-warning" };

  return (
    <div
      className={`rounded-md border-l-[3px] bg-surface/40 py-3 pl-4 pr-4 ${tone.border}`}
    >
      <p className={`text-[15px] font-medium ${tone.text}`}>{verdict.label}</p>
      <p
        className="mt-1.5 text-[14px] text-foreground-muted"
        style={{ lineHeight: 1.7 }}
      >
        {verdict.rationale}
      </p>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onToggle}
          className="text-[12px] text-foreground-muted hover:text-foreground"
        >
          How was this determined? {showReasoning ? "↓" : "↗"}
        </button>
      </div>
      {showReasoning && (
        <pre className="mt-2 whitespace-pre-wrap rounded-md bg-background/60 p-3 font-mono text-[12px] leading-5 text-foreground-muted">
          {verdict.reasoning}
        </pre>
      )}
    </div>
  );
}
