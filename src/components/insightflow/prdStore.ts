import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeEffort, type PRD, type PRDResponse } from "./prd";
import type { RoadmapItem } from "./roadmap";

type Status = "idle" | "loading" | "ready" | "error";

interface State {
  prd: PRD | null;
  status: Status;
  error: string | null;
  key: string | null;
}

const STORAGE_KEY = "insightflow.prd.v1";

function load(): State {
  if (typeof window === "undefined") {
    return { prd: null, status: "idle", error: null, key: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { prd: null, status: "idle", error: null, key: null };
    const parsed = JSON.parse(raw);
    let prd: PRD | null = parsed.prd ?? null;
    if (prd) {
      prd = {
        ...prd,
        epics: prd.epics.map((ep) => ({
          ...ep,
          userStories: ep.userStories.map((s) => ({
            ...s,
            estimatedEffort: normalizeEffort(s.estimatedEffort),
          })),
        })),
      };
    }
    return {
      prd,
      status: prd ? "ready" : "idle",
      error: null,
      key: parsed.key ?? null,
    };
  } catch {
    return { prd: null, status: "idle", error: null, key: null };
  }
}

function persist(s: State) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ prd: s.prd, key: s.key }),
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

function hashItems(items: RoadmapItem[]): string {
  return items
    .map(
      (i) =>
        `${i.id}:${i.bucket}:${i.priority}:${i.effort}:${i.quarter.q}-${i.quarter.year}`,
    )
    .join("|");
}

async function generate(
  productName: string,
  businessGoal: string,
  items: RoadmapItem[],
  executiveSummary: string,
) {
  const key = hashItems(items);
  set({ status: "loading", error: null, key });
  try {
    const { data, error } = await supabase.functions.invoke("generate-prd", {
      body: {
        productName,
        businessGoal,
        executiveSummary,
        roadmapItems: items,
      },
    });
    if (error) throw new Error(error.message || "PRD generation failed");
    const resp = data as PRDResponse;
    if (!resp?.prd) throw new Error("Malformed PRD response");
    const normalized: PRD = {
      ...resp.prd,
      epics: resp.prd.epics.map((ep) => ({
        ...ep,
        userStories: ep.userStories.map((s) => ({
          ...s,
          estimatedEffort: normalizeEffort(s.estimatedEffort),
        })),
      })),
    };
    set({ prd: normalized, status: "ready", error: null, key });
  } catch (e) {
    set({
      status: "error",
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}

export const prdStore = {
  get: () => state,
  generate,
  hydrate: (prd: PRD | null) => {
    state = { prd, status: prd ? "ready" : "idle", error: null, key: prd ? "hydrated" : null };
    persist(state);
    emit();
  },
  reset: () => {
    state = { prd: null, status: "idle", error: null, key: null };
    persist(state);
    emit();
  },
};

export function usePRD(opts: {
  productName: string;
  businessGoal: string;
  items: RoadmapItem[];
  executiveSummary: string;
}) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const key = hashItems(opts.items);

  useEffect(() => {
    if (opts.items.length === 0) return;
    if (snap.status === "loading") return;
    // Once a PRD exists (freshly generated, hydrated from library, or
    // restored from localStorage), never auto-regenerate. The user must
    // explicitly click "Regenerate" via the returned regenerate() handler.
    if (snap.prd) return;
    if (snap.status === "error") return;
    void generate(
      opts.productName,
      opts.businessGoal,
      opts.items,
      opts.executiveSummary,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    prd: snap.prd,
    status: snap.status,
    error: snap.error,
    regenerate: () =>
      generate(
        opts.productName,
        opts.businessGoal,
        opts.items,
        opts.executiveSummary,
      ),
  };
}
