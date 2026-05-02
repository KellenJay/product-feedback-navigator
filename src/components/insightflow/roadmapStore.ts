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
} from "./roadmap";

type Priority = "P1" | "P2" | "P3";

interface Override {
  bucket?: Bucket;
  bucketUserSet?: boolean;
  effort?: Effort;
  quarter?: Quarter;
  quarterUserSet?: boolean;
  priority?: Priority;
  priorityUserSet?: boolean;
  order?: number;
}
type Overrides = Record<string, Override>;

const STORAGE_KEY = "insightflow.roadmap.v3";

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

function priorityToBucket(p: Priority): Bucket {
  if (p === "P1") return "now";
  if (p === "P2") return "next";
  return "later";
}

export const roadmapStore = {
  get: () => overrides,
  setBucket: (id: string, bucket: Bucket) => {
    const prev = overrides[id] ?? {};
    const next: Override = { ...prev, bucket, bucketUserSet: true };
    if (!prev.quarterUserSet) {
      next.quarter = quarterFromBucket(bucket);
    }
    if (!prev.priorityUserSet) {
      next.priority = bucketToPriority(bucket);
    }
    overrides = { ...overrides, [id]: next };
    persist(overrides);
    emit();
  },
  setPriority: (id: string, priority: Priority) => {
    const prev = overrides[id] ?? {};
    const next: Override = { ...prev, priority, priorityUserSet: true };
    if (!prev.bucketUserSet) {
      const newBucket = priorityToBucket(priority);
      next.bucket = newBucket;
      if (!prev.quarterUserSet) {
        next.quarter = quarterFromBucket(newBucket);
      }
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
    const prev = overrides[id] ?? {};
    const next: Override = {
      ...prev,
      quarter,
      quarterUserSet: true,
    };
    // Cascade: bucket and priority follow the quarter unless the user has
    // explicitly set them.
    const derivedBucket = bucketFromQuarter(quarter);
    if (!prev.bucketUserSet) {
      next.bucket = derivedBucket;
    }
    if (!prev.priorityUserSet) {
      next.priority = bucketToPriority(derivedBucket);
    }
    overrides = { ...overrides, [id]: next };
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
