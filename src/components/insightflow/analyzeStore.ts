import { useSyncExternalStore } from "react";
import type { AnalysisResult, SourceMode } from "./types";

export interface AnalyzeState {
  productName: string;
  businessGoal: string;
  mode: SourceMode;
  pastedFeedback: string;
  uploadedFile: { name: string; content: string } | null;
  researchQuery: string;
  result: AnalysisResult | null;
}

const initialState: AnalyzeState = {
  productName: "",
  businessGoal: "",
  mode: "paste",
  pastedFeedback: "",
  uploadedFile: null,
  researchQuery: "",
  result: null,
};

// Module-level singleton — survives component remounts (HMR, tab switches,
// StrictMode double-mounts) but is naturally lost on a real page reload.
let state: AnalyzeState = { ...initialState };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot() {
  return state;
}

export const analyzeStore = {
  get: () => state,
  set: (patch: Partial<AnalyzeState>) => {
    state = { ...state, ...patch };
    emit();
  },
  reset: () => {
    state = { ...initialState };
    emit();
  },
};

export function useAnalyzeStore(): [
  AnalyzeState,
  (patch: Partial<AnalyzeState>) => void,
] {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return [snap, analyzeStore.set];
}
