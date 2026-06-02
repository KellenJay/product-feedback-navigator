import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mic, Sparkles, Square, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeStore } from "./analyzeStore";
import { libraryStore } from "./libraryStore";
import { roadmapStore } from "./roadmapStore";
import { prdStore } from "./prdStore";
import { marketContextStore } from "./marketContextStore";
import { saveAnalysis } from "@/lib/cloudSync";
import { useDictation } from "./useDictation";
import { DocumentUploader, type UploadedDoc } from "@/components/common/DocumentUploader";
import type { AnalysisResult } from "./types";

interface Props {
  hasExisting: boolean;
}

export function FeatureIdeaPanel({ hasExisting }: Props) {
  const [open, setOpen] = useState(!hasExisting);
  const [feature, setFeature] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const requestId = useMemo(() => crypto.randomUUID(), []);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { supported: voiceSupported, listening, start, stop } = useDictation((chunk) => {
    setFeature((prev) => (prev ? prev.trim() + " " + chunk.trim() : chunk.trim()));
  });

  const handleGenerate = async () => {
    const f = feature.trim();
    const name = companyName.trim();
    if (f.length < 10) {
      toast.error("Describe the feature", {
        description: "Add at least a sentence or two about what you want to build.",
      });
      return;
    }
    if (!name) {
      toast.error("Add a company name");
      return;
    }
    if (companyUrl && !/^https?:\/\/\S+\.\S+/i.test(companyUrl.trim())) {
      toast.error("Company URL looks invalid", {
        description: "Use a full URL like https://example.com",
      });
      return;
    }

    if (hasExisting) {
      const ok = window.confirm(
        "This will replace your current roadmap. Continue?",
      );
      if (!ok) return;
    }

    setLoading(true);
    try {
      const docRefs = await buildDocRefs(docs);
      const researchQuery = buildResearchQuery(f, name, companyUrl.trim(), docRefs);
      const { data, error } = await supabase.functions.invoke(
        "analyze-feedback",
        {
          body: {
            productName: name,
            businessGoal: f,
            mode: "deep-research",
            feedback: "",
            researchQuery,
          },
        },
      );

      if (error) {
        const msg = (error as { message?: string })?.message ?? "Failed";
        if (msg.includes("429")) toast.error("Rate limited", { description: "Try again shortly." });
        else if (msg.includes("402")) toast.error("AI credits exhausted", { description: "Add credits to continue." });
        else toast.error("Couldn't generate roadmap", { description: msg });
        return;
      }
      if ((data as { error?: string })?.error) {
        toast.error("Couldn't generate roadmap", {
          description: (data as { error: string }).error,
        });
        return;
      }

      const result = data as AnalysisResult;
      // Hydrate stores so the roadmap renders fresh.
      analyzeStore.set({
        productName: name,
        businessGoal: f,
        mode: "deep-research",
        researchQuery,
        result,
      });
      roadmapStore.hydrate({});
      prdStore.reset();
      marketContextStore.hydrate(null, null);

      const entry = libraryStore.recordAnalysis({
        productName: name,
        businessGoal: f,
        mode: "deep-research",
        source: `Feature idea: ${f.slice(0, 60)}`,
        result,
      });
      analyzeStore.set({ entryId: entry.id });
      void saveAnalysis({
        productName: name,
        businessGoal: f,
        mode: "deep-research",
        source: `Feature idea: ${f.slice(0, 60)}`,
        rawFeedback: researchQuery,
        result,
      }).then((res) => {
        if (res?.sessionId) {
          analyzeStore.set({ entryId: res.sessionId });
        }
      });

      toast.success("Roadmap generated", {
        description: "Scroll down to see your sprints and PRD.",
      });
      setOpen(false);
      setFeature("");
    } catch (e) {
      toast.error("Something went wrong", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
      if (listening) stop();
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              Have a feature in mind? Skip the analysis.
            </p>
            <p className="truncate text-[12px] text-foreground-muted">
              Describe it, add your company, and get a roadmap, PRD, and user stories.
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-foreground-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-foreground-muted" />
        )}
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 sm:px-5 sm:py-5">
          <Field label="Feature, bug, or upgrade to build">
            <div className="relative">
              <textarea
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                placeholder="e.g. Add an in-app referral program with shareable links and reward tracking."
                rows={4}
                className="block w-full resize-y rounded-md border border-border bg-background p-3 pr-12 text-sm leading-relaxed text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {voiceSupported && (
                <button
                  type="button"
                  onClick={listening ? stop : start}
                  aria-label={listening ? "Stop dictation" : "Start dictation"}
                  title={listening ? "Stop dictation" : "Dictate"}
                  className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    listening
                      ? "bg-destructive/15 text-destructive animate-pulse"
                      : "bg-muted text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {listening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
            </div>
            {listening && (
              <p className="mt-1 text-[11px] text-destructive">Listening… tap the square to stop.</p>
            )}
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Company URL (optional)">
              <input
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://acme.com"
                inputMode="url"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating roadmap…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate roadmap
              </>
            )}
          </button>
          <p className="mt-2 text-[11px] leading-5 text-foreground-muted">
            Builds the same roadmap, PRD, and user stories as the Analyze flow — just from your idea instead of feedback.
          </p>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground-muted">{label}</span>
      {children}
    </label>
  );
}

function buildResearchQuery(feature: string, companyName: string, companyUrl: string): string {
  return `The product team at ${companyName}${companyUrl ? ` (${companyUrl})` : ""} has already decided to build the following. They do NOT need market validation — they need a defensible delivery plan.

Feature / bug / upgrade to ship:
"""
${feature}
"""

Your task: decompose this into 5–8 concrete, shippable work items that together deliver the feature. Treat each work item exactly like a "pain point" in your normal output schema:
- title: short, action-oriented (e.g. "Build referral link generator", "Add reward ledger schema").
- description: 1–2 sentences explaining what this slice does and why it matters for the overall feature.
- impactScore (0-100): how critical this slice is to shipping the feature.
- category: a sensible engineering/product category (e.g. Backend, UX, Onboarding, Analytics, Reliability).
- priority: P1 for must-ship-first foundations, P2 for second-wave, P3 for polish/nice-to-haves.
- mentions: use a plausible small integer (1–5) as a rough complexity proxy.
- quotes: 2–3 short paraphrased perspectives a PM, engineer, or end-user might voice about this slice. Set source to "Internal", context to a plausible role (e.g. "Engineering", "Design"), date null, url null. Do NOT invent real customer quotes or external URLs.

Also produce:
- executiveSummary: one paragraph framing the feature, who it's for, and the path to ship.
- topPainArea: the most critical slice's category.
- recommendations: 2–4 tactical next steps for the team.

Return strictly via the analyze_feedback tool.`;
}
