import { useSyncExternalStore } from "react";
import type { MarketContext } from "./types";

type Status = "idle" | "loading" | "ready" | "error";

interface State {
  context: MarketContext | null;
  status: Status;
  error: string | null;
  // Identifies which analysis the cached context belongs to. We use the
  // library entry id when available so reopening a saved entry skips re-fetch.
  key: string | null;
}

const STORAGE_KEY = "insightflow.marketContext.v1";

function load(): State {
  if (typeof window === "undefined") {
    return { context: null, status: "idle", error: null, key: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { context: null, status: "idle", error: null, key: null };
    const parsed = JSON.parse(raw);
    return {
      context: parsed.context ?? null,
      status: parsed.context ? "ready" : "idle",
      error: null,
      key: parsed.key ?? null,
    };
  } catch {
    return { context: null, status: "idle", error: null, key: null };
  }
}

function persist(s: State) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ context: s.context, key: s.key }),
    );
  } catch {
    /* ignore */
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot() {
  return state;
}
function set(next: Partial<State>) {
  state = { ...state, ...next };
  persist(state);
  emit();
}

export const marketContextStore = {
  get: () => state,
  setLoading: (key: string | null) =>
    set({ status: "loading", error: null, key }),
  setReady: (context: MarketContext, key: string | null) =>
    set({ context, status: "ready", error: null, key }),
  setError: (error: string) => set({ status: "error", error }),
  hydrate: (context: MarketContext | null, key: string | null) =>
    set({
      context,
      status: context ? "ready" : "idle",
      error: null,
      key,
    }),
  reset: () => set({ context: null, status: "idle", error: null, key: null }),
};

export function useMarketContext() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
