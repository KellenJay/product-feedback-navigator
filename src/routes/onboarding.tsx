import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { requireAuth } from "@/lib/authGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { companyStore } from "@/components/profile/companyStore";
import { checklistStore } from "@/components/onboarding/checklistStore";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: requireAuth,
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Welcome — InsightFlow" }] }),
});

interface Q { key: string; headline: string; options: string[] }

const QUESTIONS: Q[] = [
  {
    key: "role",
    headline: "What best describes you?",
    options: ["Founder / Entrepreneur", "Product Manager", "SMB Owner", "Consultant / Freelancer", "Other"],
  },
  {
    key: "stage",
    headline: "Where are you in your product journey?",
    options: [
      "Pre-launch — validating an idea",
      "Early stage — just launched, getting first users",
      "Growing — have users, need to understand them better",
      "Scaling — optimizing an established product",
    ],
  },
  {
    key: "process",
    headline: "How do you currently handle customer feedback?",
    options: [
      "I read it manually and take notes",
      "I use a tool like Notion, Sheets, or Airtable",
      "I mostly go by gut feel and team input",
      "I don't have a process yet",
    ],
  },
  {
    key: "primary_goal",
    headline: "What's the #1 thing you want InsightFlow to help you with?",
    options: [
      "Understand what my users actually want",
      "Prioritize what to build next",
      "Validate a new idea before building",
      "Create roadmaps and PRDs faster",
      "Understand what competitors' customers are saying",
    ],
  },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [step, setStep] = useState(0); // 0..4 questions, 5 = confirmation
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [productName, setProductName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const s = data.session;
      if (!s) return;
      setUserId(s.user.id);
      const { data: prof } = await supabase
        .from("profiles")
        .select("first_name, display_name, onboarding_state")
        .eq("user_id", s.user.id)
        .maybeSingle();
      const state = (prof?.onboarding_state ?? {}) as { flow?: { completed?: boolean } };
      if (state.flow?.completed) {
        navigate({ to: "/app", replace: true });
        return;
      }
      setFirstName(prof?.first_name ?? prof?.display_name ?? s.user.email?.split("@")[0] ?? "");
    })();
  }, [navigate]);

  const select = (key: string, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setTimeout(() => setStep((n) => Math.min(n + 1, 4)), 150);
  };

  const finish = async () => {
    if (!userId) return;
    if (!productName.trim()) {
      toast.error("Tell us what product to start with");
      return;
    }
    setSaving(true);
    try {
      const flow = { ...answers, first_product: productName.trim(), completed: true };
      await supabase
        .from("profiles")
        .update({
          role: answers.role || null,
          onboarding_state: { flow } as never,
        })
        .eq("user_id", userId);

      // Auto-create first company set active
      await companyStore.hydrateForUser(userId);
      await companyStore.create({
        name: productName.trim(),
        description: null,
        industry: null,
        website_url: null,
        stage: null,
        setActive: true,
      });
      void checklistStore.mark("company_added");
      setStep(5);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Confirmation
  if (step === 5) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-foreground">
            You're all set{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-3 text-sm text-foreground-muted">
            We've set up your workspace for <span className="font-medium text-foreground">{productName}</span>.
            Your first analysis is ready to run.
          </p>
          <Button
            className="mt-8"
            size="lg"
            onClick={() => navigate({ to: "/app", search: { prefill: productName } as never })}
          >
            Start my first analysis <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const isLastQ = step === 4;
  const q = step < 4 ? QUESTIONS[step] : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between text-xs text-foreground-muted">
            <span className="font-medium">InsightFlow</span>
            <span>Step {step + 1} of 5</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / 5) * 100}%` }} />
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-12">
        {q && (
          <>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{q.headline}</h1>
            <div className="mt-8 space-y-2.5">
              {q.options.map((opt) => {
                const selected = answers[q.key] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => select(q.key, opt)}
                    className={`w-full rounded-lg border px-4 py-3.5 text-left text-sm transition-colors ${
                      selected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-surface text-foreground hover:border-foreground-muted"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {isLastQ && (
          <>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              What product or idea do you want to start with?
            </h1>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. My SaaS app, GoDaddy Managed WordPress, a meal planning idea…"
              className="mt-8"
              autoFocus
            />
            <p className="mt-2 text-xs text-foreground-muted">
              Don't worry, you can change this anytime.
            </p>
          </>
        )}

        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step === 0}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          {isLastQ ? (
            <Button onClick={finish} disabled={saving || !productName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finish
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setStep((n) => Math.min(4, n + 1))}
              disabled={q ? !answers[q.key] : false}
            >
              Next <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
