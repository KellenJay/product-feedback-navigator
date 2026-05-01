## Goal

Make the Gantt readable, make every roadmap item (Gantt + Kanban) clickable to a detail dialog, expose all comments behind any "X mentions" pill (Analyze + Roadmap), and export full comment lists in PDF/CSV.

## 1. Gantt: shorter window + readable cells

In `src/components/insightflow/RoadmapGantt.tsx`:

- Change `SPAN` from 6 → **4** quarters.
- Keep the "Item" column readable: bump width from `200px` to `220px` and replace `truncate` with a `line-clamp-2` so the whole theme name is visible (wraps to 2 lines).
- Quarter header labels: stack `Q2` and `2026` on two lines (`Q2` on top, year below in muted) so labels never clip in narrow columns.
- Bars: replace `truncate` with `line-clamp-2`, increase row height from `h-7` to `h-12`, add tighter padding so 3–5 words of the title are always visible.
- Each bar becomes a `<button>` that opens the new shared detail dialog.

## 2. Kanban: clickable card title

In `src/components/insightflow/RoadmapKanban.tsx`:

- Wrap the card's `<h4>` title in a `<button>` that opens the detail dialog. Stop propagation so the click does not interfere with drag.
- Drag-and-drop on the card body keeps working (only the title triggers the dialog).

## 3. Shared roadmap item detail dialog (new)

Create `src/components/insightflow/RoadmapItemDialog.tsx` using `@/components/ui/dialog`. Given a `RoadmapItem`, it shows the same info the List view exposes:

- Title, Impact pill, Priority/Quarter/Category/Effort/Mentions chips.
- Rationale paragraph.
- Full evidence list (all quotes, formatted exactly like `ResultsView` quote blocks: italic quote text, `— source · context · date`, optional "View source" link).

Wire it in `RoadmapGantt`, `RoadmapKanban`, and (for parity) make the List card title also open it.

## 4. Clickable "X mentions" → comments dialog

Create `src/components/insightflow/MentionsDialog.tsx`. Triggered from any `N mentions` pill; renders all `quotes` for the issue using the same Analyze quote layout (quote text in italics, then `— source · context · date`, optional View source link).

Make pills clickable (turn the `<span>` into a `<button>` with hover underline) in:

- `src/components/insightflow/ResultsView.tsx` (issues list, "X mentions" tag)
- `src/components/insightflow/RoadmapItemCard.tsx`
- `src/components/insightflow/RoadmapKanban.tsx` (Kanban card)
- `src/components/insightflow/MarketContextPanel.tsx` (only if it shows a mentions pill — verify and skip if not)

The Gantt bar opens the full detail dialog (which already includes evidence), so no separate mentions click is needed there.

## 5. Exports include all comments

`src/components/insightflow/exportPdf.ts`:

- Roadmap PDF: append a "Comments & evidence" appendix section per item that prints **every** quote (not just the first), each with `— source · context · date`. Same layout as the Analysis PDF appendix.
- Analysis PDF appendix already loops `it.quotes` — keep, but ensure attribution line is always rendered when any of `source/context/date` exist.

`src/components/insightflow/exportCsv.ts`:

- Replace fixed "Quote 1/2/3" columns with **one row per comment** (long format):
  - Analysis CSV: emit a second sheet-style block, OR switch to long format with columns `Rank, Title, Priority, …, Quote, Quote Source, Quote Context, Quote Date, Quote URL` and one row per quote (issue metadata repeats). Long format chosen — simpler and lossless.
  - Roadmap CSV: same treatment — one row per quote with bucket/quarter/etc. repeated.

## Technical notes

- Dialog component: shadcn `Dialog` + `DialogContent` with `max-w-2xl` and `max-h-[80vh] overflow-y-auto`.
- Reuse a single `QuoteList` helper component (new, in `src/components/insightflow/QuoteList.tsx`) used by `ResultsView`, `RoadmapItemDialog`, and `MentionsDialog` so quote rendering stays consistent.
- Refactor `ResultsView` to use `QuoteList` so the visual format stays in one place.
- No backend changes; quotes already come through on each `Issue`.

## Files

**New**
- `src/components/insightflow/QuoteList.tsx`
- `src/components/insightflow/RoadmapItemDialog.tsx`
- `src/components/insightflow/MentionsDialog.tsx`

**Edited**
- `src/components/insightflow/RoadmapGantt.tsx` (4-quarter window, readable cells, clickable bars)
- `src/components/insightflow/RoadmapKanban.tsx` (clickable title)
- `src/components/insightflow/RoadmapItemCard.tsx` (clickable mentions pill, optional clickable title)
- `src/components/insightflow/ResultsView.tsx` (clickable mentions pill, use `QuoteList`)
- `src/components/insightflow/exportPdf.ts` (full comments in roadmap appendix)
- `src/components/insightflow/exportCsv.ts` (long-format quotes)
