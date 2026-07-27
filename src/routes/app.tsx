import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/authGuard";
import { saveAnalysis } from "@/lib/cloudSync";
import { gradeAnalysis } from "@/lib/gradeAnalysis.functions";
import { ArrowUp } from "lucide-react";
import { toast, Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TabBar } from "@/components/insightflow/TabBar";
import { IntentTabs } from "@/components/insightflow/IntentTabs";
import { InputPanel } from "@/components/insightflow/InputPanel";
import { ResultsView } from "@/components/insightflow/ResultsView";
import { MarketContextPanel } from "@/components/insightflow/MarketContextPanel";
import { AnalysisFooter } from "@/components/insightflow/AnalysisFooter";
import { useAnalyzeStore } from "@/components/insightflow/analyzeStore";
import { libraryStore } from "@/components/insightflow/libraryStore";
import { roadmapStore } from "@/components/insightflow/roadmapStore";
import { prdStore } from "@/components/insightflow/prdStore";
import { marketContextStore } from "@/components/insightflow/marketContextStore";
import { fetchContext as fetchMarketContext } from "@/components/insightflow/MarketContextPanel";
import type { AnalysisResult } from "@/components/insightflow/types";

export const Route = createFileRoute("/app")({
  beforeLoad: requireAuth,
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
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@500;600;700&display=swap",
      },
    ],
  }),
});

function AnalyzePage() {
  const [state, setState] = useAnalyzeStore();
  const {
    intent,
    productName,
    businessGoal,
    mode,
    pastedFeedback,
    uploadedFile,
    researchQuery,
    result,
  } = state;

  const setIntent = (i: typeof intent) => setState({ intent: i });

  const setProductName = (v: string) => setState({ productName: v });
  const setBusinessGoal = (v: string) => setState({ businessGoal: v });
  const setMode = (m: typeof mode) => setState({ mode: m });
  const setPastedFeedback = (v: string) => setState({ pastedFeedback: v });
  const setUploadedFile = (
    f: { name: string; content: string } | null,
  ) => setState({ uploadedFile: f });
  const setResearchQuery = (v: string) => setState({ researchQuery: v });
  const setResult = (r: AnalysisResult | null) => setState({ result: r });

  const [loading, setLoading] = useState(false);
  const gradeAnalysisFn = useServerFn(gradeAnalysis);

  const handleAnalyze = async () => {
    if (!productName.trim()) {
      toast.error(
        intent === "idea" ? "Add an idea name" : "Add a product name",
        {
          description:
            intent === "idea"
              ? "Give your idea a short name so we know what to validate."
              : "Tell us which product the feedback is about.",
        },
      );
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
            intent,
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
      // Auto-record into Library as a recent (unsaved) entry.
      const sourceLabel =
        mode === "paste"
          ? "Pasted feedback"
          : mode === "upload"
            ? uploadedFile?.name ?? "Uploaded file"
            : researchQuery
              ? `Deep research: ${researchQuery.slice(0, 60)}`
              : "Deep research";
      const newEntry = libraryStore.recordAnalysis({
        productName,
        businessGoal,
        mode,
        source: sourceLabel,
        result: data as AnalysisResult,
      });
      // New analysis → bind session to the new entry, and clear stale
      // roadmap/PRD/market caches so they regenerate from scratch.
      setState({ entryId: newEntry.id });
      roadmapStore.hydrate({});
      prdStore.reset();
      marketContextStore.hydrate(null, newEntry.id);
      const analysisResult = data as AnalysisResult;
      // Persist to cloud (background; non-blocking).
      void saveAnalysis({
        productName,
        businessGoal,
        mode,
        source: sourceLabel,
        rawFeedback: feedback,
        result: analysisResult,
      }).then((res) => {
        if (res?.sessionId) {
          // Replace the local-only entry id with the cloud session id so
          // subsequent saves (roadmap, PRD, market context) reference the
          // correct row.
          setState({ entryId: res.sessionId });
          marketContextStore.hydrate(null, res.sessionId);
          // Auto-run market context once for this fresh analysis, bound
          // to the cloud session id so it persists.
          void fetchMarketContext(
            productName,
            businessGoal,
            analysisResult.issues.slice(0, 3).map((i) => ({
              title: i.title,
              impactScore: i.impactScore,
            })),
            res.sessionId,
          );
        }
      });
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
        <div className="mx-auto flex max-w-[780px] items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-base font-semibold text-foreground">
            InsightFlow
          </span>
          <span className="text-xs text-foreground-muted">
            {"\n"}
          </span>
        </div>
      </header>

      <TabBar active="analyze" />

      <main className="mx-auto max-w-[780px] px-4 pb-24 sm:px-6">
        {/* Input */}
        <div className="relative mt-8 sm:mt-12">
          <IntentTabs intent={intent} setIntent={setIntent} />
          <InputPanel
            intent={intent}
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
        {result && (
          <MarketContextPanel
            productName={productName}
            businessGoal={businessGoal}
            topPainPoints={result.issues.slice(0, 3).map((i) => ({
              title: i.title,
              impactScore: i.impactScore,
            }))}
          />
        )}
        {result && <AnalysisFooter productName={productName} result={result} />}
      </main>

      {result && (
        <button
          type="button"
          onClick={() =>
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary-hover hover:shadow-primary/40 animate-in fade-in slide-in-from-bottom-2"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
