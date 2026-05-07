## 1. Effort terms → L / M / H (Low / Medium / High)

Today the Effort scale is **S / M / L** meaning Small / Medium / Large, and the UI shows e.g. "Effort S". You want **L / M / H** meaning Low / Medium / High, displayed as just the letter.

- `src/components/insightflow/roadmap.ts`
  - Change `Effort` type from `"S" | "M" | "L"` → `"L" | "M" | "H"`.
  - Update `EFFORT_META` labels to `Low / Medium / High`.
  - Update `deriveEffort()` thresholds so impact ≥ 75 → `H`, low‑mention low‑impact → `L`, otherwise `M`.
  - `buildRoadmapMarkdown` keeps a `Effort Low/Medium/High` word in markdown export (clearer in plaintext).
- `src/components/insightflow/RoadmapItemCard.tsx`
  - Dropdown options become `L / M / H`.
  - Display text drops the word — show just the letter (e.g. `L`, `M`, `H`) instead of `Effort L`.
- `src/components/insightflow/RoadmapSummary.tsx`, `RoadmapKanban.tsx`, `RoadmapItemDialog.tsx`, `RoadmapGantt.tsx` — update tag rendering to show only the letter.
- `src/components/insightflow/exportPdf.ts`, `exportCsv.ts` — column header stays "Effort", value is the letter.
- `src/components/insightflow/roadmapStore.ts`
  - Add a one‑time migration in `load()` that rewrites any persisted override `effort` from old `S/M/L` (Small/Medium/Large) to new `L/M/H` (Low/Medium/High) using mapping `S→L`, `M→M`, `L→H`. Bump storage key to `insightflow.roadmap.v5` so the rewrite happens once on read.
- `src/components/insightflow/prd.ts`
  - `PRDEffort` becomes `"L" | "M" | "H"` (drop `XL`).
  - `effortClasses` updated; PRD generation function (`supabase/functions/generate-prd/index.ts`) prompt and JSON schema updated to emit `L/M/H` and the JSON normalizer maps any legacy `S→L`, `XL→H`.
- `PRDPanel.tsx` — story chip shows just the letter.

## 2. Save analysis = save everything (roadmap + PRD + market context)

Currently a "saved" library entry only contains the raw `AnalysisResult`. The roadmap overrides, the generated PRD, and the market context live in three separate global stores keyed by nothing, so reopening an entry re‑does work and loses tweaks.

- Extend `LibraryEntry` (`libraryStore.ts`):
  ```ts
  roadmapOverrides?: Record<string, RoadmapOverride>;
  prd?: PRD | null;
  marketContext?: MarketContext | null;
  ```
- New helper `libraryStore.captureSnapshot(id)` reads the current contents of `roadmapStore`, `prdStore`, and a new `marketContextStore` and writes them onto the entry.
- Wire up:
  - `libraryStore.save(id)` and `moveToFolder(id, …)` call `captureSnapshot(id)` first, so "Save to library" persists the full bundle.
  - The Roadmap tab also auto‑updates the snapshot on every roadmap/PRD change **only if the entry is already saved** (so unsaved Recent items stay frozen at first analyze).

## 3. Reopening from library should NOT re‑analyze

Today, opening an entry → "Open in Analyze" only restores `productName / businessGoal / mode / result`. The Roadmap tab then triggers `generate‑prd` and the Analyze tab triggers `market‑context` again, costing money.

- Add `marketContextStore.ts` (same pattern as `prdStore`) keyed by entry id; hydrate it from `entry.marketContext` when opening.
- `LibraryEntryDialog.handleOpenInAnalyze`:
  - Push the entry id into `analyzeStore.set({ ..., entryId })`.
  - Hydrate `roadmapStore` from `entry.roadmapOverrides`, `prdStore` from `entry.prd`, `marketContextStore` from `entry.marketContext`.
- `MarketContextPanel.tsx`:
  - Read from `marketContextStore` first; only call the edge function if no cached context exists for the current entry id.
  - Add an **"Analyze again"** button rendered just above the existing analysis‑completed footer (and just below the verdict card). Click → re‑invokes `market-context`, replaces the cached version, and (if the entry is saved) updates the library snapshot. Same pattern for `prdStore` (skip auto‑generate when a saved PRD is hydrated).

## 4. PRD PDF export — fit A4, proper structure

`exportPrdPdf.ts` overflows the page because section headers (`h1/h2/h3`) and bullet lines call `doc.text(text, …)` with no wrap, and the bottom‑of‑page check uses a hardcoded `285` instead of the real A4 height (297mm).

Rewrite the helpers so every text write goes through `splitTextToSize`:

- Constants: `PAGE_HEIGHT = 297`, `MARGIN_TOP = 20`, `MARGIN_BOTTOM = 20`, `usable = PAGE_HEIGHT - MARGIN_BOTTOM`.
- New `writeWrapped(doc, text, { x, y, size, font, lineHeight, color })` that wraps to `CONTENT_WIDTH - (x - MARGIN)` and adds a page when `y + lineHeight > usable`.
- `h1` (18pt bold), `h2` (13pt bold + thin underline), `h3` (11pt bold) all wrap.
- Paragraphs: 10pt regular, line height 5.5mm, dark grey.
- Bullets/checkboxes: hanging indent so wrapped lines align under the text, not under the `•`/`☐`.
- Each major section (`Overview`, `Epics`, `Execution`, `Metrics`) starts on a new page only if there isn't ~40mm of room left, instead of always `addPage()`.
- Title block: title wraps; subtitle (`v1.0 · Draft · Generated …`) on its own line.
- File still saved as `<product>-prd.pdf`. After implementing, render the PDF and visually QA each page to confirm nothing clips.

## 5. "Create new folder" inside the move‑to‑folder dropdown

In `LibraryEntryDialog.tsx`, the "Move to folder" dropdown only lists existing folders. Add an inline option at the bottom:

- A `+ New folder…` `DropdownMenuItem` that, when clicked, swaps to a small inline input inside the menu (`onSelect={e => e.preventDefault()}` to keep the menu open).
- Pressing Enter calls `libraryStore.createFolder(name)` then `libraryStore.moveToFolder(entry.id, newFolder.id)` and closes the menu with a toast `Moved to "<name>"`.
- Pressing Escape or blurring with empty input cancels.
- Existing top‑level "+ New folder" button on the Library page is left untouched.

## Out of scope (per your instructions)

- No changes to the analysis‑completed footer, GoDaddy/date/export buttons row, or anything else not listed above.
- No backend schema changes (everything still local‑storage based).
