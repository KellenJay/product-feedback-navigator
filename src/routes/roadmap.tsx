import { createFileRoute, Link } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { TabBar } from "@/components/insightflow/TabBar";
import { useAnalyzeStore } from "@/components/insightflow/analyzeStore";
import { useRoadmap } from "@/components/insightflow/roadmapStore";
import { RoadmapColumn } from "@/components/insightflow/RoadmapColumn";
import { RoadmapSummary } from "@/components/insightflow/RoadmapSummary";
import { RoadmapFooter } from "@/components/insightflow/RoadmapFooter";
import type { Bucket } from "@/components/insightflow/roadmap";

export const Route = createFileRoute("/roadmap")({
  component: RoadmapPage,
  head: () => ({
    meta: [
      { title: "Roadmap — InsightFlow" },
      {
        name: "description",
        content:
          "Turn your latest InsightFlow analysis into a sprint-ready roadmap with Now, Next, and Later buckets, effort estimates, and markdown export.",
      },
      { property: "og:title", content: "Roadmap — InsightFlow" },
      {
        property: "og:description",
        content:
          "A defensible product roadmap derived from real user feedback — grouped by sprint, scored by impact.",
      },
    ],
  }),
});

function RoadmapPage() {
  const [{ result, productName }] = useAnalyzeStore();

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[780px] items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-base font-semibold text-foreground hover:opacity-80"
          >
            InsightFlow
          </Link>
          <span className="text-xs text-foreground-muted">v1 · Roadmap</span>
        </div>
      </header>

      <TabBar active="roadmap" />

      <main className="mx-auto max-w-[780px] px-6 pb-24 pt-12">
        {!result ? <EmptyState /> : <RoadmapBody result={result} productName={productName} />}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
        No analysis yet
      </p>
      <h1
        className="font-display mx-auto mt-3 max-w-[460px] text-foreground"
        style={{ fontSize: "clamp(26px, 4vw, 36px)", lineHeight: 1.1 }}
      >
        Run an analysis first — your roadmap builds itself.
      </h1>
      <p className="mx-auto mt-4 max-w-[480px] text-[14px] leading-7 text-foreground-muted">
        InsightFlow turns your prioritized pain points into a sprint-ready plan.
        Once you've analyzed feedback, the items appear here grouped into Now,
        Next, and Later.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Go to Analyze
      </Link>
    </section>
  );
}

function RoadmapBody({
  result,
  productName,
}: {
  result: NonNullable<ReturnType<typeof useAnalyzeStore>[0]["result"]>;
  productName: string;
}) {
  const { items, setBucket, setEffort, reset, hasOverrides } =
    useRoadmap(result);

  const buckets: Bucket[] = ["now", "next", "later"];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate text-center">
        <div className="hero-beam" aria-hidden />
        <div className="hero-grid absolute inset-0 -z-10" aria-hidden />

        <div className="relative inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground-muted backdrop-blur">
          Sprint-ready roadmap
        </div>

        <h1
          className="font-display relative mt-6 text-foreground"
          style={{ fontSize: "clamp(34px, 5vw, 52px)", lineHeight: 1.05 }}
        >
          Your next three sprints,{" "}
          <span className="text-gradient-brand">defended</span>
        </h1>
        <p className="relative mx-auto mt-4 max-w-[560px] text-[14px] leading-7 text-foreground-muted">
          Derived from {productName || "your latest analysis"} ·{" "}
          {result.issues.length} pain points scored by impact, mentions, and
          priority. Move items between buckets — your changes save automatically.
        </p>
      </section>

      <div className="mt-8">
        <RoadmapSummary items={items} />
      </div>

      {buckets.map((b) => (
        <RoadmapColumn
          key={b}
          bucket={b}
          items={items.filter((i) => i.bucket === b)}
          onMove={setBucket}
          onEffort={setEffort}
        />
      ))}

      <RoadmapFooter
        items={items}
        productName={productName}
        hasOverrides={hasOverrides}
        onReset={reset}
      />
    </>
  );
}
