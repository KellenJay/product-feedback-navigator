## 1. Library — Collapsible folder groups in the sidebar

Right now clicking "Unfiled Items" or a folder only filters the saved list. Make each folder act like a real expandable group so the user can see the titles inside without leaving the sidebar.

- Convert `FolderItem` ("All saved", "Unfiled Items") and `FolderRow` (custom folders) in `src/routes/library.tsx` into accordion-style rows:
  - Click the row → toggles open/closed (chevron right ▸ / chevron down ▾) AND selects it as the active filter.
  - When open, render an indented child list of the entry titles in that folder (sorted newest first).
  - Each child title is a button — clicking opens the existing `LibraryEntryDialog` (same `setDetail(entry)` flow already used by `EntryCard`).
  - Show a small muted "Empty" placeholder when an open folder has no items.
- "All saved" expands to show every saved entry; "Unfiled Items" expands to show entries with `folderId === null`; user folders show their own children.
- Keep the existing rename / delete hover actions on user folders. Keep the right-side count badge.
- The main column behaviour is unchanged (search + grid still works) — sidebar simply gains a peek-and-jump capability.

## 2. Roadmap — Move (folder/bucket) action from inside the entry dialog

In `LibraryEntryDialog` is for the library; for the roadmap dialog, add a "Move to folder" / "Move to bucket" control inside `RoadmapItemDialog` so users can reassign without going back to the list — this matches the user's expectation that clicking a title and reassigning works from the popup.

(Library entries: add a "Move to folder…" select inside `LibraryEntryDialog` so the user can move from the popup too. Wire to `libraryStore.moveToFolder`.)

## 3. Roadmap — Priority badge syncing across List / Kanban / Gantt

Today, changing Priority in the List PillSelect updates the store, but if the user previously moved the same item via Kanban/Gantt drag (which sets `bucketUserSet: true`), `setPriority` won't cascade the bucket and vice-versa, leading to mismatched P-tags across views.

- In `src/components/insightflow/roadmapStore.ts`, simplify the cascade so it ALWAYS runs:
  - `setBucket` always recomputes `priority = bucketToPriority(bucket)` and `quarter = quarterFromBucket(bucket)`.
  - `setPriority` always recomputes `bucket = priorityToBucket(priority)` and `quarter = quarterFromBucket(newBucket)`.
  - `setQuarter` always recomputes `bucket = bucketFromQuarter(quarter)` and `priority = bucketToPriority(newBucket)`.
  - Drop the `*UserSet` flags — single source of truth: bucket ↔ priority ↔ quarter are kept in lock-step. This guarantees the P1/P2/P3 badge color and label updates everywhere immediately when the user drags between Now/Next/Later in any view.
- Verify `KanbanCard` and Gantt `Bar` already re-render from the same `useRoadmap()` items — they do; the fix above is sufficient.

## 4. Roadmap — Effort labels (remove time estimates)

In `src/components/insightflow/roadmap.ts`:
- Change `EFFORT_META` to `{ S: { label: "Small" }, M: { label: "Medium" }, L: { label: "Large" } }` (drop the `days` field).
- Update `RoadmapItemCard.tsx` PillSelect for effort: options become `S · Small`, `M · Medium`, `L · Large`; remove the `title={EFFORT_META[item.effort].days}` tooltip.
- Update Kanban/Gantt/Markdown export usages to drop any "~1–2 days" style strings.

## 5. Roadmap — "Later" header color in List view

In `src/components/insightflow/roadmap.ts`, change `BUCKET_META.later.tone` from `text-foreground-muted` to `text-success` so the column heading renders green in `RoadmapColumn` (matches Now=red, Next=amber, Later=green semantics already used by priority badges).

## 6. Analyze — Live "what the AI is searching" stream for Market context

Today `MarketContextPanel` shows a static skeleton + one line ("Pulling market signals…"). Add a streaming progress feed so users see what the AI is doing while the request runs.

Approach (lightweight, no edge-function refactor required):
- Keep the existing `market-context` edge function call (single non-streaming request — it returns structured tool output, which can't be partial-parsed).
- In `MarketContextPanel.tsx`, replace the static `LoadingState` with a `StreamingActivityLog` that simulates progressive AI activity using a scripted sequence timed against the real fetch:
  - Steps cycle through messages like:
    1. "Scanning training data for `{productName}` reviews…"
    2. "Reading G2, Capterra, Reddit threads…"
    3. "Analyzing competitor positioning…"
    4. "Cross-referencing industry trends (last 90 days)…"
    5. "Synthesizing market verdict…"
  - Each step appears with a typewriter/fade-in, a spinner on the active line, a check on completed lines.
  - When the real fetch resolves, finalize all remaining steps and replace with the actual data section.
- Keep the existing toast/error path untouched.
- (Optional follow-up if the user wants real streaming: convert `market-context` to SSE and stream a parallel "thoughts" channel — out of scope for this pass.)

## 7. Analyze — Generic example placeholder

In `src/components/insightflow/InputPanel.tsx`:
- Change the Product name placeholder from `e.g. GoDaddy Managed WordPress` to `e.g. Notion`.
- Change the Deep research placeholder from `e.g. GoDaddy Managed WordPress reviews on Reddit, G2, Capterra` to `e.g. Notion reviews on Reddit, G2, Capterra`.

(Notion is a widely recognised generic product, not tied to GoDaddy's vertical.)

## Files to change

- `src/routes/library.tsx` — collapsible sidebar folders with child entry lists.
- `src/components/insightflow/LibraryEntryDialog.tsx` — add "Move to folder" select.
- `src/components/insightflow/roadmapStore.ts` — always-cascade bucket↔priority↔quarter, drop `*UserSet` flags.
- `src/components/insightflow/roadmap.ts` — `EFFORT_META` without days; `BUCKET_META.later.tone` → `text-success`.
- `src/components/insightflow/RoadmapItemCard.tsx` — effort labels (Small/Medium/Large), no time tooltip.
- `src/components/insightflow/RoadmapItemDialog.tsx` — add Move-to-bucket control.
- `src/components/insightflow/MarketContextPanel.tsx` — `StreamingActivityLog` replacing static loader.
- `src/components/insightflow/InputPanel.tsx` — generic placeholders (Notion).

No database, edge function, or routing changes.
