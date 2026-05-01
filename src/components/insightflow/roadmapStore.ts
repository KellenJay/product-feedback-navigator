import { useSyncExternalStore } from "react";
import type { AnalysisResult } from "./types";
import {
  deriveRoadmap,
  quarterFromBucket,
  type Bucket,
  type Effort,
  type Quarter,
  type RoadmapItem,
} from "./roadmap";

interface Override {
  bucket?: Bucket;
  effort?: Effort;
  quarter?: Quarter;
  quarterUserSet?: boolean;
  order?: number;
}
type Overrides = Record<string, Override>;

const STORAGE_KEY = "insightflow.roadmap.v2";

function load(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
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

export const roadmapStore = {
  get: () => overrides,
  setBucket: (id: string, bucket: Bucket) => {
    const prev = overrides[id] ?? {};
    // If user hasn't pinned a quarter, recompute from bucket.
    const next: Override = { ...prev, bucket };
    if (!prev.quarterUserSet) {
      next.quarter = quarterFromBucket(bucket);
    }
    overrides = { ...overrides, [id]: next };
    persist(overrides);
    emit();
  },
  setEffort: (id: string, effort: Effort) => {
    overrides = { ...overrides, [id]: { ...overrides[id], effort } };
    persist(overrides);
    emit();
  },
  setQuarter: (id: string, quarter: Quarter) => {
    overrides = {
      ...overrides,
      [id]: { ...overrides[id], quarter, quarterUserSet: true },
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
};

export function useRoadmap(result: AnalysisResult): {
  items: RoadmapItem[];
  setBucket: (id: string, b: Bucket) => void;
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
      order: o.order,
    };
  });
  return {
    items,
    setBucket: roadmapStore.setBucket,
    setEffort: roadmapStore.setEffort,
    setQuarter: roadmapStore.setQuarter,
    setOrder: roadmapStore.setOrder,
    reset: roadmapStore.reset,
    hasOverrides: Object.keys(ov).length > 0,
  };
}
