import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SurveyAnswers {
  role?: string;
  teamSize?: string;
  source?: string;
  sourceOther?: string;
}

export interface OnboardingState {
  loaded: boolean;
  userId: string | null;
  survey: { completed: boolean; skipped: boolean; answers: SurveyAnswers };
  checklist: {
    analyze: boolean;
    roadmap: boolean;
    library: boolean;
    dismissed: boolean;
    collapsed: boolean;
  };
}

const initial: OnboardingState = {
  loaded: false,
  userId: null,
  survey: { completed: false, skipped: false, answers: {} },
  checklist: {
    analyze: false,
    roadmap: false,
    library: false,
    dismissed: false,
    collapsed: false,
  },
};

let state: OnboardingState = { ...initial };
const listeners = new Set<() => void>();
const emit = () => { for (const l of listeners) l(); };

function persistRemote() {
  if (!state.userId) return;
  const payload = { survey: state.survey, checklist: state.checklist };
  void supabase
    .from("profiles")
    .update({ onboarding_state: payload as unknown } as never)
    .eq("user_id", state.userId);
}


function merge(patch: Partial<OnboardingState>) {
  state = { ...state, ...patch };
  emit();
}

export const onboardingStore = {
  get: () => state,
  async hydrateForUser(userId: string) {
    if (state.userId === userId && state.loaded) return;
    state = { ...initial, userId };
    emit();
    try {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_state")
        .eq("user_id", userId)
        .maybeSingle();
      const remote = (data?.onboarding_state ?? {}) as Partial<OnboardingState>;
      state = {
        ...initial,
        userId,
        loaded: true,
        survey: { ...initial.survey, ...(remote.survey ?? {}) },
        checklist: { ...initial.checklist, ...(remote.checklist ?? {}) },
      };
    } catch {
      state = { ...state, loaded: true };
    }
    emit();
  },
  clear() {
    state = { ...initial };
    emit();
  },
  completeSurvey(answers: SurveyAnswers) {
    merge({ survey: { completed: true, skipped: false, answers } });
    persistRemote();
  },
  skipSurvey() {
    merge({ survey: { ...state.survey, skipped: true } });
    persistRemote();
  },
  markStep(step: "analyze" | "roadmap" | "library") {
    if (state.checklist[step]) return;
    merge({ checklist: { ...state.checklist, [step]: true } });
    persistRemote();
  },
  dismissChecklist() {
    merge({ checklist: { ...state.checklist, dismissed: true } });
    persistRemote();
  },
  toggleCollapsed() {
    merge({ checklist: { ...state.checklist, collapsed: !state.checklist.collapsed } });
    persistRemote();
  },
};

export function useOnboarding(): OnboardingState {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => state,
    () => state,
  );
}
