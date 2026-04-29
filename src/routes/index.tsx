import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TabBar } from "@/components/insightflow/TabBar";
import { InputPanel } from "@/components/insightflow/InputPanel";
import { ResultsView } from "@/components/insightflow/ResultsView";
import type { AnalysisResult, SourceMode } from "@/components/insightflow/types";

export const Route = createFileRoute("/")({
  component: AnalyzePage,
  head: () => ({
    meta: [
      { title: "InsightFlow — Turn customer feedback into prioritized roadmaps" },
      {
        name: "description",
        content:
          "AI-powered product feedback intelligence. Paste reviews, upload docs, or research the web — InsightFlow analyzes pain points and scores them by impact.",
      },
      { property: "og:title", content: "InsightFlow" },
      {
        property: "og:description",
        content:
          "Turn raw customer feedback into prioritized roadmaps in minutes.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap",
      },
    ],
  }),
});

function AnalyzePage() {
  const [productName, setProductName] = useState("");
  const [businessGoal, setBusinessGoal] = useState("");
  const [mode, setMode] = useState<SourceMode>("paste");
  const [pastedFeedback, setPastedFeedback] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const [researchQuery, setResearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!productName.trim()) {
      toast.error("Add a product name", {
        description: "Tell us which product the feedback is about.",
      });
      return;
    }

    let feedback = "";
    if (mode === "paste") {
      feedback = pastedFeedback.trim();
      if (feedback.length < 20) {
        toast.error("Add more feedback", {
          description: "Paste at least a few sentences to analyze.",
        });
        return;
      }
    } else if (mode === "upload") {
      if (!uploadedFile) {
        toast.error("Upload a document first");
        return;
      }
      feedback = uploadedFile.content;
    } else if (mode === "deep-research") {
      if (!researchQuery.trim()) {
        toast.error("Tell us what to research");
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-feedback",
        {
          body: {
            productName,
            businessGoal,
            mode,
            feedback,
            researchQuery,
          },
        },
      );

      if (error) {
        const msg =
          (error as { message?: string })?.message ?? "Analysis failed";
        if (msg.includes("429")) {
          toast.error("Rate limited", {
            description: "Too many requests. Try again in a moment.",
          });
        } else if (msg.includes("402")) {
          toast.error("AI credits exhausted", {
            description: "Add credits in your workspace to continue.",
          });
        } else {
          toast.error("Analysis failed", { description: msg });
        }
        return;
      }

      if ((data as { error?: string })?.error) {
        toast.error("Analysis failed", {
          description: (data as { error: string }).error,
        });
        return;
      }

      setResult(data as AnalysisResult);
      toast.success("Analysis complete");
      // Scroll to results
      setTimeout(() => {
        document
          .getElementById("results-anchor")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      toast.error("Something went wrong", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      {/* Top bar with brand */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[780px] items-center justify-between px-6 py-4">
          <span className="text-base font-semibold text-foreground">
            InsightFlow
          </span>
          <span className="text-xs text-foreground-muted">
            v1 · Analyze
          </span>
        </div>
      </header>

      <TabBar active="analyze" />

      <main className="mx-auto max-w-[780px] px-6 pb-24 pt-12">
        {/* Hero */}
        <section className="relative isolate text-center">
          <div className="hero-glow" aria-hidden />
          <div className="hero-grid absolute inset-0 -z-10" aria-hidden />

          {/* Eyebrow */}
          <div className="relative inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-[11px] font-medium text-foreground-muted backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            AI feedback intelligence for product managers
          </div>

          <h1 className="relative mt-5 text-[32px] font-medium leading-[1.15] tracking-tight text-foreground md:text-[38px]">
            Turn raw customer feedback into{" "}
            <span className="text-gradient-brand">prioritized roadmaps</span>
            <span className="text-foreground"> — in minutes.</span>
          </h1>
          <p className="relative mx-auto mt-4 max-w-[640px] text-[15px] leading-7 text-foreground-muted">
            Paste reviews, upload a document, or let AI research the web.
            InsightFlow analyzes pain points, scores them by impact, and
            generates a structured summary ready for roadmapping.
          </p>

          {/* Trust micro-row */}
          <div className="relative mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wider text-foreground-muted">
            <span>Reddit</span><span className="opacity-40">·</span>
            <span>Capterra</span><span className="opacity-40">·</span>
            <span>G2</span><span className="opacity-40">·</span>
            <span>CSV</span><span className="opacity-40">·</span>
            <span>PDF</span>
          </div>
        </section>

        {/* Input */}
        <div className="mt-8">
          <InputPanel
            productName={productName}
            setProductName={setProductName}
            businessGoal={businessGoal}
            setBusinessGoal={setBusinessGoal}
            mode={mode}
            setMode={setMode}
            pastedFeedback={pastedFeedback}
            setPastedFeedback={setPastedFeedback}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            researchQuery={researchQuery}
            setResearchQuery={setResearchQuery}
            loading={loading}
            onAnalyze={handleAnalyze}
          />
        </div>

        <div id="results-anchor" />
        {result && <ResultsView result={result} productName={productName} />}
      </main>
    </div>
  );
}
