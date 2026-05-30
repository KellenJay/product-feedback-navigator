import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { onboardingStore, useOnboarding } from "./onboardingStore";

const ROLES = ["Product Manager", "Founder", "Designer", "Engineer", "Other"];
const TEAM_SIZES = ["Just me", "2–10", "11–50", "50+"];
const SOURCES = ["Twitter / X", "LinkedIn", "Friend", "Search", "Other"];

export function OnboardingSurveyDialog() {
  const ob = useOnboarding();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [source, setSource] = useState("");
  const [sourceOther, setSourceOther] = useState("");

  const open =
    ob.loaded && !!ob.userId && !ob.survey.completed && !ob.survey.skipped;

  const canNext =
    (step === 0 && role) || (step === 1 && teamSize) || (step === 2 && source);

  const finish = () => {
    onboardingStore.completeSurvey({
      role,
      teamSize,
      source,
      sourceOther: source === "Other" ? sourceOther : undefined,
    });
  };

  const skip = () => onboardingStore.skipSurvey();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) skip(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to InsightFlow</DialogTitle>
          <DialogDescription>
            A quick 3-question intro so we can tailor the experience. Step {step + 1} of 3.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {step === 0 && (
            <>
              <p className="text-sm font-medium text-foreground">What's your role?</p>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${role === r ? "border-primary bg-primary/10 text-foreground" : "border-border text-foreground-muted hover:text-foreground"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <p className="text-sm font-medium text-foreground">How big is your team?</p>
              <div className="flex flex-wrap gap-2">
                {TEAM_SIZES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTeamSize(t)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${teamSize === t ? "border-primary bg-primary/10 text-foreground" : "border-border text-foreground-muted hover:text-foreground"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <p className="text-sm font-medium text-foreground">How did you hear about us?</p>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSource(s)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${source === s ? "border-primary bg-primary/10 text-foreground" : "border-border text-foreground-muted hover:text-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {source === "Other" && (
                <Input
                  placeholder="Tell us more"
                  value={sourceOther}
                  onChange={(e) => setSourceOther(e.target.value)}
                  className="mt-2"
                />
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={skip}>
            Skip for now
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button size="sm" disabled={!canNext} onClick={() => setStep(step + 1)}>
                Next
              </Button>
            ) : (
              <Button size="sm" disabled={!canNext} onClick={finish}>
                Finish
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
