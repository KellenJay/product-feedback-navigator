import { useSyncExternalStore } from "react";
import type { AnalysisResult, MarketContext } from "./types";
import type { PRD } from "./prd";
import type { Overrides as RoadmapOverrides } from "./roadmapStore";
import { roadmapStore } from "./roadmapStore";
import { prdStore } from "./prdStore";
import { marketContextStore } from "./marketContextStore";

export interface LibraryEntry {
  id: string;
  title: string; // productName, or first words of researchQuery
  productName: string;
  businessGoal: string;
  mode: "paste" | "upload" | "deep-research";
  source: string; // short label e.g. "Pasted feedback", "feedback.csv", "Deep research"
  result: AnalysisResult;
  createdAt: number; // ms epoch
  saved: boolean;
  folderId: string | null;
  // Full bundle persisted alongside the analysis so reopening doesn't re-run
  // expensive AI calls. All optional for backwards-compat with old entries.
  roadmapOverrides?: RoadmapOverrides;
  prd?: PRD | null;
  marketContext?: MarketContext | null;
}

export interface LibraryFolder {
  id: string;
  name: string;
  createdAt: number;
}

interface LibraryState {
  entries: LibraryEntry[];
  folders: LibraryFolder[];
}

const STORAGE_KEY = "insightflow.library.v1";
const RECENT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadFromStorage(): LibraryState {
  if (typeof window === "undefined") return { entries: [], folders: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [], folders: [] };
    const parsed = JSON.parse(raw) as LibraryState;
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
    };
  } catch {
    return { entries: [], folders: [] };
  }
}

function persist(s: LibraryState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
}

function pruneExpired(s: LibraryState): LibraryState {
  const now = Date.now();
  const entries = s.entries.filter(
    (e) => e.saved || now - e.createdAt < RECENT_TTL_MS,
  );
  if (entries.length === s.entries.length) return s;
  return { ...s, entries };
}

let state: LibraryState = pruneExpired(loadFromStorage());
const listeners = new Set<() => void>();

function emit() {
  persist(state);
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

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const libraryStore = {
  get: () => state,

  recordAnalysis(input: {
    productName: string;
    businessGoal: string;
    mode: LibraryEntry["mode"];
    source: string;
    result: AnalysisResult;
  }): LibraryEntry {
    const entry: LibraryEntry = {
      id: uid(),
      title: input.productName.trim() || "Untitled analysis",
      productName: input.productName,
      businessGoal: input.businessGoal,
      mode: input.mode,
      source: input.source,
      result: input.result,
      createdAt: Date.now(),
      saved: false,
      folderId: null,
    };
    state = pruneExpired({ ...state, entries: [entry, ...state.entries] });
    emit();
    return entry;
  },

  captureSnapshot(id: string) {
    const ro = roadmapStore.get();
    const prd = prdStore.get().prd;
    const mc = marketContextStore.get().context;
    state = {
      ...state,
      entries: state.entries.map((e) =>
        e.id === id
          ? {
              ...e,
              roadmapOverrides: ro,
              prd,
              marketContext: mc,
            }
          : e,
      ),
    };
    emit();
  },

  save(id: string, folderId: string | null = null) {
    // Snapshot current roadmap/PRD/market context onto entry first.
    const ro = roadmapStore.get();
    const prd = prdStore.get().prd;
    const mc = marketContextStore.get().context;
    state = {
      ...state,
      entries: state.entries.map((e) =>
        e.id === id
          ? {
              ...e,
              saved: true,
              folderId,
              roadmapOverrides: ro,
              prd,
              marketContext: mc,
            }
          : e,
      ),
    };
    emit();
  },

  unsave(id: string) {
    state = {
      ...state,
      entries: state.entries.map((e) =>
        e.id === id
          ? { ...e, saved: false, folderId: null, createdAt: Date.now() }
          : e,
      ),
    };
    emit();
  },

  remove(id: string) {
    state = { ...state, entries: state.entries.filter((e) => e.id !== id) };
    emit();
  },

  rename(id: string, title: string) {
    state = {
      ...state,
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, title: title.trim() || e.title } : e,
      ),
    };
    emit();
  },

  moveToFolder(id: string, folderId: string | null) {
    const ro = roadmapStore.get();
    const prd = prdStore.get().prd;
    const mc = marketContextStore.get().context;
    state = {
      ...state,
      entries: state.entries.map((e) =>
        e.id === id
          ? {
              ...e,
              folderId,
              saved: true,
              roadmapOverrides: ro,
              prd,
              marketContext: mc,
            }
          : e,
      ),
    };
    emit();
  },

  createFolder(name: string): LibraryFolder {
    const folder: LibraryFolder = {
      id: uid(),
      name: name.trim() || "Untitled folder",
      createdAt: Date.now(),
    };
    state = { ...state, folders: [...state.folders, folder] };
    emit();
    return folder;
  },

  renameFolder(id: string, name: string) {
    state = {
      ...state,
      folders: state.folders.map((f) =>
        f.id === id ? { ...f, name: name.trim() || f.name } : f,
      ),
    };
    emit();
  },

  deleteFolder(id: string) {
    // Move entries in this folder back to "unfiled saved"
    state = {
      ...state,
      folders: state.folders.filter((f) => f.id !== id),
      entries: state.entries.map((e) =>
        e.folderId === id ? { ...e, folderId: null } : e,
      ),
    };
    emit();
  },

  // Update the persisted bundle (roadmap overrides, PRD, market context)
  // attached to an entry. Used so saved entries always reflect the latest
  // state of the roadmap/PRD/market panels.
  updateBundle(
    id: string,
    bundle: {
      roadmapOverrides?: RoadmapOverrides;
      prd?: PRD | null;
      marketContext?: MarketContext | null;
    },
  ) {
    state = {
      ...state,
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, ...bundle } : e,
      ),
    };
    emit();
  },
};

export function useLibrary(): LibraryState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function daysUntilExpiry(createdAt: number): number {
  const remaining = RECENT_TTL_MS - (Date.now() - createdAt);
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

export function formatRelativeDate(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
