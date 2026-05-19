import { useSyncExternalStore } from "react";
import type { AnalysisResult } from "./types";
import {
  bucketToPriority,
  bucketFromQuarter,
  deriveRoadmap,
  quarterFromBucket,
  type Bucket,
  type Effort,
  type Quarter,
  type RoadmapItem,
  type Status,
  type Timeframe,
} from "./roadmap";

type Priority = "P1" | "P2" | "P3";

export interface Override {
  bucket?: Bucket;
  effort?: Effort;
  quarter?: Quarter;
  priority?: Priority;
  order?: number;
  status?: Status;
  completedAt?: number;
}
export type Overrides = Record<string, Override>;

const STORAGE_KEY = "insightflow.roadmap.v6";
const LEGACY_KEY = "insightflow.roadmap.v4";
const LEGACY_V5_KEY = "insightflow.roadmap.v5";
const TIMEFRAME_KEY = "insightflow.roadmap.timeframe";

function migrateEffort(o: Override): Override {
  // Old scale: S/M/L (Small/Medium/Large) → New scale: L/M/H (Low/Medium/High)
  // S→L, M→M, L→H. New values pass through unchanged.
  if (!o.effort) return o;
  const e = o.effort as unknown as string;
  if (e === "L" || e === "M" || e === "H") return o;
  if (e === "S") return { ...o, effort: "L" };
  if (e === "L") return { ...o, effort: "H" }; // unreachable; kept for clarity
  return o;
}

function load(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Try v5 first, then v4
      raw = window.localStorage.getItem(LEGACY_V5_KEY);
      if (!raw) {
        const legacy = window.localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const legacyParsed = JSON.parse(legacy) as Overrides;
          const migrated: Overrides = {};
          for (const [id, ov] of Object.entries(legacyParsed)) {
            let next: Override = { ...ov };
            const e = ov.effort as unknown as string | undefined;
            if (e === "S") next.effort = "L";
            else if (e === "M") next.effort = "M";
            else if (e === "L") next.effort = "H";
            migrated[id] = next;
          }
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          } catch { /* ignore */ }
          return migrated;
        }
        return {};
      }
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: Overrides = {};
    for (const [id, ov] of Object.entries(parsed as Overrides)) {
      out[id] = migrateEffort(ov);
    }
    return out;
  } catch {
    return {};
  }
}

function loadTimeframe(): Timeframe {
  if (typeof window === "undefined") return "quarters";
  try {
    const raw = window.localStorage.getItem(TIMEFRAME_KEY);
    if (raw === "weeks" || raw === "months" || raw === "quarters") return raw;
  } catch { /* ignore */ }
  return "quarters";
}

function persistTimeframe(tf: Timeframe) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TIMEFRAME_KEY, tf);
  } catch { /* ignore */ }
}

function persist(value: Overrides) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

let overrides: Overrides = load();
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
  return overrides;
}

function getServerSnapshot() {
  return {} as Overrides;
}

function priorityToBucket(p: Priority): Bucket {
  if (p === "P1") return "now";
  if (p === "P2") return "next";
  return "later";
}

// Bucket ↔ Priority ↔ Quarter are kept in lock-step. Whichever the user
// changes, the other two are recomputed so all three views stay consistent.
export const roadmapStore = {
  get: () => overrides,
  setBucket: (id: string, bucket: Bucket) => {
    const prev = overrides[id] ?? {};
    overrides = {
      ...overrides,
      [id]: {
        ...prev,
        bucket,
        priority: bucketToPriority(bucket),
        quarter: quarterFromBucket(bucket),
      },
    };
    persist(overrides);
    emit();
  },
  setPriority: (id: string, priority: Priority) => {
    const prev = overrides[id] ?? {};
    const newBucket = priorityToBucket(priority);
    overrides = {
      ...overrides,
      [id]: {
        ...prev,
        priority,
        bucket: newBucket,
        quarter: quarterFromBucket(newBucket),
      },
    };
    persist(overrides);
    emit();
  },
  setEffort: (id: string, effort: Effort) => {
    overrides = { ...overrides, [id]: { ...overrides[id], effort } };
    persist(overrides);
    emit();
  },
  setQuarter: (id: string, quarter: Quarter) => {
    const prev = overrides[id] ?? {};
    const newBucket = bucketFromQuarter(quarter);
    overrides = {
      ...overrides,
      [id]: {
        ...prev,
        quarter,
        bucket: newBucket,
        priority: bucketToPriority(newBucket),
      },
    };
    persist(overrides);
    emit();
  },
  setOrder: (id: string, order: number) => {
    overrides = { ...overrides, [id]: { ...overrides[id], order } };
    persist(overrides);
    emit();
  },
  reset: () => {
    overrides = {};
    persist(overrides);
    emit();
  },
  hydrate: (next: Overrides | null | undefined) => {
    overrides = next ? { ...next } : {};
    persist(overrides);
    emit();
  },
};

export function useRoadmap(result: AnalysisResult): {
  items: RoadmapItem[];
  setBucket: (id: string, b: Bucket) => void;
  setPriority: (id: string, p: Priority) => void;
  setEffort: (id: string, e: Effort) => void;
  setQuarter: (id: string, q: Quarter) => void;
  setOrder: (id: string, n: number) => void;
  reset: () => void;
  hasOverrides: boolean;
} {
  const ov = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const base = deriveRoadmap(result);
  const items = base.map((it) => {
    const o = ov[it.id];
    if (!o) return it;
    return {
      ...it,
      bucket: o.bucket ?? it.bucket,
      effort: o.effort ?? it.effort,
      quarter: o.quarter ?? (o.bucket ? quarterFromBucket(o.bucket) : it.quarter),
      priority: o.priority ?? it.priority,
      order: o.order,
    };
  });
  return {
    items,
    setBucket: roadmapStore.setBucket,
    setPriority: roadmapStore.setPriority,
    setEffort: roadmapStore.setEffort,
    setQuarter: roadmapStore.setQuarter,
    setOrder: roadmapStore.setOrder,
    reset: roadmapStore.reset,
    hasOverrides: Object.keys(ov).length > 0,
  };
}
