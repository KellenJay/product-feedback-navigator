import { useSyncExternalStore } from "react";

export interface PRDQuestionState {
  answer: string;
  resolved: boolean;
}

export type PRDQuestionMap = Record<string, PRDQuestionState>;

const STORAGE_KEY = "insightflow.prd.questions.v1";

function load(): PRDQuestionMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as PRDQuestionMap;
  } catch {
    return {};
  }
}

function persist(value: PRDQuestionMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

let state: PRDQuestionMap = load();
const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

export const prdQuestionStore = {
  get: () => state,
  setAnswer: (q: string, answer: string) => {
    const prev = state[q] ?? { answer: "", resolved: false };
    state = { ...state, [q]: { ...prev, answer } };
    persist(state);
    emit();
  },
  setResolved: (q: string, resolved: boolean) => {
    const prev = state[q] ?? { answer: "", resolved: false };
    state = { ...state, [q]: { ...prev, resolved } };
    persist(state);
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function usePRDQuestions(): PRDQuestionMap {
  return useSyncExternalStore(
    prdQuestionStore.subscribe,
    prdQuestionStore.get,
    () => ({}),
  );
}
