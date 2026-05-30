## Goals

1. Make every page, tab, panel, and icon usable on mobile and tablet (no horizontal overflow, no clipped text). Desktop layout stays the same.
2. On the Roadmap page, add an optional "Build from a feature idea" entry — type or speak a feature, plus company name + URL — and generate a roadmap + PRD/user stories without going through Analyze. Nothing else about Roadmap changes.

## 1. Mobile + tablet responsiveness

Sweep the InsightFlow surfaces and fix overflow / cramped layouts. Pure CSS/Tailwind class changes — no logic touched.

Worst offenders (confirmed):
- `MarketContextPanel.tsx` — Competitive landscape uses fixed `grid-cols-[140px_1fr_120px]`, which forces horizontal overflow on ~390px screens. Switch to a stacked layout under `sm:` (name + signal in one row, approach underneath) and keep the 3-column grid from `sm:` upward.
- `roadmap.tsx` header — `max-w-[780px]` row plus tab pills can wrap awkwardly. Reduce horizontal padding to `px-4 sm:px-6`, allow `RoadmapViewTabs` / `RoadmapTimeframeTabs` to wrap with `gap-y-2`.
- `RoadmapKanban.tsx` — 3-column board needs `overflow-x-auto` with `min-w-[260px]` columns on mobile so users can swipe sideways instead of squishing.
- `RoadmapGantt.tsx` — already wide; wrap chart in a horizontally scrollable container; keep labels sticky-left on mobile.
- `RoadmapItemCard.tsx`, `RoadmapItemDialog.tsx` — pill rows need `flex-wrap` + smaller gap on mobile, dialog gets `max-w-[calc(100vw-1.5rem)]`.
- `PRDPanel.tsx` — section headers / tab bars wrap; tables in metrics/questions get `overflow-x-auto`.
- `InputPanel.tsx` — mode pill row already wraps; verify CTA button and textarea heights feel right on small screens (textarea height 140 → `min-h-[140px]`).
- `TabBar.tsx` — horizontal scrollable tab strip with `overflow-x-auto` + `snap-x` on mobile so all tabs reachable.
- `app.tsx`, `library.tsx`, `account.tsx`, landing `index.tsx` headers — replace fixed `max-w-[780px] px-6` with `px-4 sm:px-6`, ensure header rows use `flex-wrap` where they currently overflow.
- Global: audit any `grid-cols-[Npx_...]` patterns (only the Competitor grid found so far) and any `min-w-[XXXpx]` without an `overflow-x-auto` parent.

Approach: add small responsive variants only (`sm:`, `md:`) — desktop layout is preserved verbatim. No copy or behavior changes.

Verification: visually check Analyze, Roadmap (all 3 views), Library, PRD panel, landing page at 375px, 768px, and 1280px.

## 2. Roadmap "Build from a feature idea" panel

A new collapsible card at the top of `/roadmap` (above the hero), shown always. Users can:
- Type a feature description, OR press a mic button to dictate (Web Speech API `SpeechRecognition`, with a fallback message if unsupported).
- Enter Company name and Company URL (URL optional, validated as URL when present).
- Click "Generate roadmap" → backend produces a synthetic analysis-shaped result, which feeds the existing roadmap + PRD flow unchanged.

Nothing about the existing Roadmap views, tabs, exports, notes, PRD, or persistence changes. The panel just provides another way to populate `analyzeStore` / `useRoadmap`.

### UX

- Card title: "Have a feature in mind? Skip the analysis."
- Inputs: Feature description (textarea, mic toggle), Company name (input), Company URL (input).
- CTA: "Generate roadmap" with loading state. On success: card collapses, hero/roadmap below renders with the new items; toast confirms.
- If existing analysis is present, show a subtle warning: "This will replace your current roadmap." with Cancel/Confirm.
- Voice: small mic button inside the textarea. While recording, show "Listening…" and live-append transcript. Stops on second click or silence.

### Backend (TanStack server function)

New `src/lib/featureRoadmap.functions.ts` exporting `generateFeatureRoadmap` (`createServerFn`):
- Input (Zod): `{ feature: string (1–4000), companyName: string (1–200), companyUrl?: string (url, max 500) }`.
- Reads `LOVABLE_API_KEY` from `process.env` inside `.handler()`.
- Uses AI SDK `generateText` + `Output.object` via the Lovable AI Gateway helper (already used in classic stack pattern; will live in `src/lib/aiGateway.server.ts` — small helper). Model: `google/gemini-3-flash-preview`.
- Prompts the model to: (a) infer 4–8 plausible pain-point-style issues that decompose the requested feature into shippable slices, (b) write rationale and 2–3 short illustrative quotes per issue, (c) produce a one-paragraph executive summary. The URL is included as light context (no network fetch — keeps the function reliable and cheap).
- Returns an `AnalysisResult`-shaped payload compatible with `analyzeStore` and `deriveRoadmap`.

### Client wiring

- New component `src/components/insightflow/FeatureIdeaPanel.tsx` rendered above the hero in `roadmap.tsx` (inside `RoadmapPage`, before `main`'s body switch — so it shows even in the empty state, replacing the need to go to Analyze).
- On submit: call the server fn via `useServerFn` → on success, call `analyzeStore.setResult(...)`, `analyzeStore.setProduct(companyName)`, clear `roadmapStore` overrides (`roadmapStore.hydrate({})`) and `prdStore` so we render the fresh roadmap.
- Voice: small hook `useDictation` wrapping `webkitSpeechRecognition` / `SpeechRecognition`. Gracefully hidden when unsupported.

### Out of scope (explicit)

- No changes to Analyze page logic, PRDPanel structure, RoadmapColumn/Kanban/Gantt, exports, library, or auth.
- No web scraping of the company URL (kept as prompt context only) — keeps the feature within the Worker runtime constraints.
- No new database tables.

## Files

New:
- `src/components/insightflow/FeatureIdeaPanel.tsx`
- `src/components/insightflow/useDictation.ts`
- `src/lib/featureRoadmap.functions.ts`
- `src/lib/aiGateway.server.ts` (Lovable AI Gateway helper, if not already present)

Edited (responsive sweep + roadmap entry):
- `src/routes/roadmap.tsx`, `src/routes/app.tsx`, `src/routes/library.tsx`, `src/routes/account.tsx`, `src/routes/index.tsx`
- `src/components/insightflow/MarketContextPanel.tsx`, `RoadmapKanban.tsx`, `RoadmapGantt.tsx`, `RoadmapItemCard.tsx`, `RoadmapItemDialog.tsx`, `PRDPanel.tsx`, `InputPanel.tsx`, `TabBar.tsx`, `RoadmapViewTabs.tsx`

If `LOVABLE_API_KEY` is not yet present I'll request it before implementing the server function.
