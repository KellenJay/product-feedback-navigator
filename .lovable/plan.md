## Goals

1. **Roadmap → Gantt view**: make tickets drag-and-droppable across quarter columns. Dropping into a new quarter updates the item's quarter and cascades priority + bucket + color exactly like the existing dropdown logic.
2. **Roadmap → List view**: declutter each card by removing the row of bottom dropdowns (Priority / Effort / Quarter) and turning the top inline pills (P1, Q2 26, Effort) into clickable dropdowns. Keep the "Move to Now/Next/Later" dropdown — it stays at the bottom by the Evidence area.
3. **Library**: no changes — user concluded the current rename/delete behavior is fine.

## Scope

### 1. `RoadmapGantt.tsx` — drag & drop bars between quarter columns
- Add HTML5 drag handlers (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) so each `<Bar>` can be picked up and each grid cell becomes a drop target.
- On drop, call a new `onQuarterChange(itemId, quarter)` prop wired to `roadmapStore.setQuarter`. Reuse the same store call the List view already uses, so all the existing cascade logic (priority/bucket/color stays consistent based on quarter→bucket relationship — see note below) works.
- Quarter→bucket cascade: extend `roadmapStore` with a `setQuarterCascade` action (or extend `setQuarter`) that, when the user moves an item to a future quarter, also updates bucket and (if not user-overridden) priority — current quarter → `now`/P1 (red), +1 quarter → `next`/P2 (yellow), +2 or beyond → `later`/P3 (green). This matches the user's expectation: dragging "battery life" to Q3 2026 (1 quarter out from current Q2 2026) turns it yellow/P2.
- Visual feedback while dragging: highlight the hovered drop cell (e.g. ring or bg-primary/10) and dim the source row.
- Pass `onQuarterChange` from `src/routes/roadmap.tsx` (already has access to `setQuarter` from `useRoadmap`).
- The existing click-to-open dialog must still work — only initiate drag from a pointer drag, not a click.

### 2. `RoadmapItemCard.tsx` — inline pill dropdowns, remove bottom controls
- Delete the bottom "Priority / Effort / Quarter" `SelectControl` row entirely.
- Keep the "Move to" `SelectControl` — render it next to / below the "Show evidence" toggle so it remains as the only bottom control.
- Convert the three pill spans in the metadata row into native `<select>` controls styled to look identical to the current pills:
  - **P1 pill** → select with options P1/P2/P3, keeps `priorityClasses(value)` styling so color updates live (red/yellow/green).
  - **Q2 26 pill** → select with the same 8-quarter list as `QuarterSelect`, keeps `bg-primary/15 text-primary` styling.
  - **Effort pill** → select with S/M/L, keeps current styling and tooltip with `EFFORT_META[value].days`.
- The Category and Mentions pills stay as static spans (read-only).
- Implementation note: build a small `PillSelect` helper that wraps a `<select>` in the pill's classes and uses an absolutely-positioned transparent `<select>` over a styled span (standard pattern) so the dropdown chevron isn't required and styling stays clean.

### 3. No changes
- `RoadmapItemDialog.tsx` (popup details) — leave as is.
- `RoadmapKanban.tsx` — leave as is.
- `roadmap.ts` types — no shape changes; may add a small `bucketFromQuarter(q, today)` helper used by the cascade.
- Library page — no changes this round.

## Files to edit

- `src/components/insightflow/roadmapStore.ts` — add cascade behavior to `setQuarter` (or new `setQuarterAndCascade`) so dragging on Gantt updates bucket + priority unless user-overridden.
- `src/components/insightflow/roadmap.ts` — add `bucketFromQuarter(q, today)` helper.
- `src/components/insightflow/RoadmapGantt.tsx` — drag-and-drop on bars + quarter columns; accept `onQuarter` prop.
- `src/routes/roadmap.tsx` — pass `setQuarter` to `<RoadmapGantt>`.
- `src/components/insightflow/RoadmapItemCard.tsx` — restructure pill row into inline dropdowns; remove bottom Priority/Effort/Quarter controls; keep Move-to.

## Acceptance criteria

- On Gantt: I can drag any bar to a different quarter column. Color and priority badge update to match the new quarter (Now=red/P1, Next=yellow/P2, Later=green/P3). Clicking a bar still opens the detail dialog.
- On List: each card shows a single bottom control ("Move to") next to the evidence toggle. The P1/Quarter/Effort pills at the top of the card are now interactive dropdowns. Changing any one updates the card live and persists.
- Library tab is unchanged.
