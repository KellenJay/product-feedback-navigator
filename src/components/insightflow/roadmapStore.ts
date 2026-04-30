import { useSyncExternalStore } from "react";
import type { AnalysisResult } from "./types";
import {
  deriveRoadmap,
  type Bucket,
  type Effort,
  type RoadmapItem,
} from "./roadmap";

type Override = Partial<Pick<RoadmapItem, "bucket" | "effort">>;
type Overrides = Record<string, Override>;

const STORAGE_KEY = "insightflow.roadmap.v1";

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
    overrides = { ...overrides, [id]: { ...overrides[id], bucket } };
    persist(overrides);
    emit();
  },
  setEffort: (id: string, effort: Effort) => {
    overrides = { ...overrides, [id]: { ...overrides[id], effort } };
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
    };
  });
  return {
    items,
    setBucket: roadmapStore.setBucket,
    setEffort: roadmapStore.setEffort,
    reset: roadmapStore.reset,
    hasOverrides: Object.keys(ov).length > 0,
  };
}
