## 1. Fix overlapping text in Competitive landscape

File: `src/components/insightflow/MarketContextPanel.tsx`

The competitor row uses a fixed `grid-cols-[110px_1fr_110px]` so long names like "LangChain / LangGraph" run into the approach column.

- Widen and soften the name column: change to `grid-cols-[140px_1fr_120px]`.
- Add `min-w-0 break-words` to the name span and `min-w-0` to the approach span so text wraps cleanly instead of overflowing.
- No other styling changes.

## 2. Remove "Weeks" timeframe everywhere

User feedback: weeks is confusing. Keep Months + Quarters; default stays Quarters.

- `roadmap.ts` — change `Timeframe` to `"months" | "quarters"`. Update `formatTimeframeLabel` / `formatTimeframeRange` to drop the weeks branch; remove `isoWeek` (or leave unexported if still imported elsewhere — check and prune).
- `roadmapStore.ts` — `loadTimeframe()` accepts only `"months" | "quarters"` (falls back to `"quarters"`); migrate any persisted `"weeks"` value to `"quarters"` on load.
- `RoadmapViewTabs.tsx` — drop the Weeks entry from `TF_TABS` and the `CalendarDays` import.
- No other files need changes; `RoadmapItemCard`, `RoadmapKanban`, `RoadmapGantt` already just call the formatters.

## 3. Per-ticket notes/comments, shared across List / Kanban / Gantt / PRD

Goal: replace the "Show evidence" toggle on the List card with a "Notes" toggle so users can add a comment per ticket. The same note is visible (and editable) wherever the ticket appears, and it ends up in the PRD copy/export.

### Data model
- `roadmap.ts` — add optional `note?: string` to `RoadmapItem`.
- `roadmapStore.ts`:
  - Add `note?: string` to `Override`.
  - Add `setNote(id, note)` action; empty string clears the field.
  - Merge `o.note` into the derived item in `useRoadmap`.
  - Expose `setNote` from the `useRoadmap` return.
- Persistence already piggybacks on `roadmap_overrides` jsonb in the `roadmaps` table — no schema change.

### List view (`RoadmapItemCard.tsx`)
- Replace the "Show evidence (n) / Hide evidence" expander with a "Notes" expander (same chevron pattern, same position). Label shows "Add note" when empty and "Note" when filled.
- Expanded body: a small `<textarea>` (3 rows, `text-[12px]`, surface background, border) bound to `item.note`, with a debounced `onChange` calling `setNote(item.id, value)`. No save button — autosaves on change.
- The verbatim quotes already live in the title-click dialog (`RoadmapItemDialog`), so removing them from the card body is intentional and matches the user request.

### Kanban (`RoadmapKanban.tsx` / `KanbanCard`)
- Add a single-line note preview under the metadata row: shows up to ~80 chars of `item.note` in muted text if present, else nothing. Clicking the card title still opens the dialog where the note is editable.

### Gantt (`RoadmapGantt.tsx`)
- Add a small note indicator (e.g. a dot or "📝" icon — match existing icon style) next to the title in the left column when `item.note` is set. Editing happens via the dialog.

### Dialog (`RoadmapItemDialog.tsx`)
- Add a "Notes" section above the Evidence section with the same `<textarea>` bound to the store via `setNote`. This is what makes the note editable from Kanban + Gantt.
- Dialog needs the `setNote` callback; pass it down from `roadmap.tsx` via existing props on the three view components, OR have the dialog import `roadmapStore` directly and call `roadmapStore.setNote`. Use the direct-store approach to avoid prop-drilling through Gantt/Kanban — same pattern already used by `roadmapStore` mutators.

### PRD export
- `prd.ts` `buildPRDText` — already iterates items via the roadmap, but the PRD is generated server-side. Notes are user-added metadata, so append them to the copyable text and PDF locally:
  - In `PRDPanel.handleCopy` / `handlePdf`, before formatting, fold per-item notes into a new "Team notes" appendix section listing `- {item.title}: {item.note}` for items where `note` is set.
  - Pass `items` (already in props) into the helper.

## 4. PRD "Open questions" — answers + resolved/unresolved

File: `src/components/insightflow/PRDPanel.tsx` (Metrics tab → Open questions section, lines ~498+).

- Introduce a tiny `prdQuestionStore` (new file `src/components/insightflow/prdQuestionStore.ts`) that maps `questionText → { answer: string; resolved: boolean }` in localStorage (key `insightflow.prd.questions.v1`). Same `useSyncExternalStore` pattern as `roadmapStore`.
  - Keyed by question text rather than index so re-generations stay stable when ordering changes; collisions are acceptable given the small list.
- Replace the bullet list with one row per question:
  - The question text (existing styling).
  - A small `<textarea>` (2 rows) for the answer/comment, autosaved.
  - A pill toggle: "Unresolved" (warning style) ↔ "Resolved" (success style). Clicking toggles `resolved` and visually strikes through the question + dims the row when resolved.
- Export: include answer + status in `buildPRDText`'s "Open questions" section — change `- (Unresolved) {q}` to `- ({Resolved|Unresolved}) {q}` + indented `Answer: {answer}` when present. Wire from `PRDPanel.handleCopy`/`handlePdf` (read store snapshot, pass into a small local formatter or extend the existing helper).

## Out of scope (untouched)

Landing page, Library, auth, Supabase schema/migrations, Analyze input/results, market-context generation logic, exports outside of the two additions above, view layouts/styling of Kanban/Gantt beyond the note indicator/preview described.

## Technical notes

- No DB migration: `roadmap_overrides` jsonb already absorbs the new `note` field; PRD question state lives in localStorage only (matches how PRD targets in the Metrics table already work — they're uncontrolled inputs).
- `Timeframe` narrowing is a type change; verify no remaining `"weeks"` literal references with a project search before finishing.
- Note autosave: simple `useState` mirror + 300ms debounced `setNote` call to avoid thrashing the store on every keystroke.
