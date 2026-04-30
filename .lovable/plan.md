## Roadmap page — plan

Goal: take the latest `AnalysisResult` (already in the in-memory `analyzeStore`) and present it as a defensible, sprint-ready roadmap grouped into **Now**, **Next**, **Later**, with effort, impact, evidence, and export. No new backend yet — purely a transformation of existing analysis data, plus local persistence of user adjustments.

### 1. Routing & nav

- New file: `src/routes/roadmap.tsx` (TanStack file-based route `/roadmap`) with its own `head()` (title, description, og:title, og:description).
- `src/components/insightflow/TabBar.tsx`: turn the Roadmap tab into a real `<Link to="/roadmap">` (remove `opacity-60` and the "coming soon" toast). Library stays stubbed. Accept `active` of `"analyze" | "roadmap" | "library"` as it already does.
- `src/routes/__root.tsx`: no changes expected (already provides shell). Will verify on implementation.

### 2. Empty state

If `analyzeStore.get().result` is `null`:
- Show a centered card: "No analysis yet" + short copy + primary button → `<Link to="/">Run an analysis</Link>`.
- Include the same `TabBar` with `active="roadmap"` and the same header so layout is consistent with `/`.

### 3. Data model — derived, not re-fetched

Add `src/components/insightflow/roadmap.ts`:

- `type Bucket = "now" | "next" | "later"`
- `type Effort = "S" | "M" | "L"`
- `interface RoadmapItem { id: string; issueIndex: number; title: string; bucket: Bucket; effort: Effort; impactScore: number; priority: "P1"|"P2"|"P3"; category: string; mentions: number; rationale: string; quotes: Quote[]; }`
- `deriveRoadmap(result: AnalysisResult): RoadmapItem[]` — default mapping:
  - `priority === "P1"` → `now`
  - `priority === "P2"` → `next`
  - `priority === "P3"` → `later`
  - `effort` heuristic from `impactScore` + `mentions` (high mentions + low score → S; high score → L; otherwise M). Pure function, deterministic.
  - `id = `issue-${issueIndex}``
  - `rationale` = first sentence of `issue.description`.

Why derive instead of store: the analysis is the source of truth. The roadmap is a view over it plus user overrides.

### 4. Roadmap state (overrides + persistence)

New module `src/components/insightflow/roadmapStore.ts` (same `useSyncExternalStore` pattern as `analyzeStore.ts`):

- Holds `Record<string, Partial<Pick<RoadmapItem, "bucket" | "effort">>>` keyed by `id`.
- Persisted to `localStorage` under `insightflow.roadmap.v1` so reordering survives reload (the analysis itself is intentionally in-memory only — overrides reset the moment a new analysis runs because IDs are tied to issue index, which is fine for v1).
- Exposes `setBucket(id, bucket)`, `setEffort(id, effort)`, `reset()`.
- Hook `useRoadmap(result)` returns `{ items, setBucket, setEffort, reset }` — applies overrides on top of `deriveRoadmap(result)`.

### 5. Page layout (`/roadmap`)

Reuses the same `max-w-[780px]` shell, header, and `TabBar` from `/`.

```text
┌─ Header (InsightFlow · v1 · Roadmap) ─────────────┐
├─ TabBar (Analyze | Roadmap* | Library) ───────────┤
│                                                   │
│  Eyebrow: "Sprint-ready roadmap"                  │
│  H1:      Your next three sprints, defended       │
│  Sub:     Derived from <productName> · N items    │
│                                                   │
│  [Summary strip]  P1: 3   P2: 5   P3: 4   Effort  │
│                                                   │
│  ── Now (this sprint) ───────────────────────     │
│   ▣ Item card  · Impact 82 · P1 · M · 14 mentions │
│     Rationale + 1 quote (collapsible)             │
│     [Move to Next ▾] [Effort: M ▾]                │
│                                                   │
│  ── Next (1–2 sprints) ──────────────────────     │
│   ...                                             │
│                                                   │
│  ── Later (backlog) ─────────────────────────     │
│   ...                                             │
│                                                   │
│  Footer: [Copy as markdown] [Export PDF]          │
│          [Reset overrides]                        │
└───────────────────────────────────────────────────┘
```

### 6. Components to add (under `src/components/insightflow/`)

- `RoadmapColumn.tsx` — section header (Now / Next / Later) + count + items list.
- `RoadmapItemCard.tsx` — title, impact pill, priority tag, effort chip, mentions, rationale, expandable evidence (reuses the same quote-rendering style as `ResultsView`), and two inline `<select>`-style menus for **Move to** and **Effort**. Use existing shadcn primitives already in the project (avoid adding new deps); fall back to native `<select>` styled with the same border/bg classes.
- `RoadmapSummary.tsx` — small stat strip (P1 / P2 / P3 counts, total effort estimate as `S+M+L` tally).
- `RoadmapFooter.tsx` — Copy as markdown (writes to clipboard via `navigator.clipboard`), Export PDF (toast "Coming next"), Reset overrides (calls `roadmapStore.reset()` + toast).

No drag-and-drop library in v1 — keeps deps lean. Move via the per-card menu. We can add `@dnd-kit` later if the user asks.

### 7. Markdown export

`copyRoadmapMarkdown(items, productName)` builds:

```text
# Roadmap — <Product>
_Generated <date> from InsightFlow_

## Now (this sprint)
- **<title>** — Impact <n> · P1 · Effort M · <mentions> mentions
  <rationale>

## Next (1–2 sprints)
...
```

Copied to clipboard. This is the real "defensible output" the hero copy promised.

### 8. Hero / cross-link from `/`

In `src/routes/index.tsx` `AnalysisFooter` already has "Save to library" / "Export PDF" / "Back to top". Add a primary link in the footer area (or in `ResultsView`'s recommendations section) → `<Link to="/roadmap">Open roadmap →</Link>` so users go straight there after analysis. Single small addition; no layout rewrite.

### 9. Files touched / created

Created:
- `src/routes/roadmap.tsx`
- `src/components/insightflow/roadmap.ts` (pure derivation + types)
- `src/components/insightflow/roadmapStore.ts` (overrides + localStorage)
- `src/components/insightflow/RoadmapColumn.tsx`
- `src/components/insightflow/RoadmapItemCard.tsx`
- `src/components/insightflow/RoadmapSummary.tsx`
- `src/components/insightflow/RoadmapFooter.tsx`

Edited:
- `src/components/insightflow/TabBar.tsx` — Roadmap tab becomes a real `<Link>`.
- `src/routes/index.tsx` — add a single "Open roadmap →" link once results exist.

### 10. Out of scope (can follow up)

- Drag-and-drop reordering (menu-based for v1)
- Real PDF export (toast for now, matching existing pattern)
- Persisting the analysis itself across reloads (intentional per earlier decision — only user-driven actions should persist)
- Library tab and saving multiple roadmaps
- Auth / multi-user

Confirm and I'll build it.
