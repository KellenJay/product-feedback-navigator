## Scope

Two changes only. Everything else (Analyze layout, Library, auth, Supabase, landing page) stays as-is.

---

## 1. Fix "Open in Analyze" not showing saved data

### What's broken

When you click **Open in Analyze** from a Library entry, you land on `/app` but the saved analysis doesn't appear. Today the dialog hydrates the stores then navigates, but:

- `/app` shows results inside an `{result && ...}` block far below the hero/input. If `result` arrives but the page doesn't scroll, it looks empty.
- The `result` field on older Library entries may be `null` (entries that synced before `analysis_output` was populated), so `ResultsView` silently renders nothing.
- The Library entry's cached `marketContext` is hydrated, but `MarketContextPanel` is rendered fresh each visit — for old entries with no cached context it still looks blank with no clear way to refresh.
- There is no explicit way for the user to choose "keep the saved snapshot" vs "re-run analysis + market/competitor scan".

### Fix

In `src/components/insightflow/LibraryEntryDialog.tsx` → `handleOpenInAnalyze`:
- Keep the existing store hydration (analyze + roadmap + PRD + market context).
- After `navigate({ to: "/app" })`, scroll to `#results-anchor` so the restored analysis is immediately visible.
- If `live.result` is missing/empty, show a toast ("This saved entry has no cached analysis — click Reanalyze") instead of silently navigating to a blank state.

In `src/routes/app.tsx`:
- When `entryId` is set AND `result` is present (i.e. the session was restored from Library, not freshly analyzed), render a small banner above the results:
  - Label: *"Restored from Library — last saved {relative date}"*
  - Two buttons:
    - **Reanalyze feedback** — re-runs `analyze-feedback` (same flow as Analyze button; requires raw feedback, so if the entry doesn't have it we prompt the user to paste/upload again).
    - **Update market & competitor analysis** — calls `fetchMarketContext(...)` for the current `entryId`, replacing the cached context.
- The default behavior on restore is **no AI calls** — saved data is shown as-is. AI only runs on explicit click.

In `src/components/insightflow/MarketContextPanel.tsx`:
- No behavior change needed (it already has no auto-fetch). The new "Update market & competitor analysis" button in the banner calls the same `fetchContext` helper.

### Scope guard

No changes to: cloudSync schema, analyzeStore shape, Library list/dialog layout, auth, or the Analyze input/results UI itself beyond the new restore banner.

---

## 2. Roadmap: switchable time granularity + completion status

### What you'll get

On the **Roadmap** tab, above the existing **List / Kanban / Gantt** view tabs, a new **Timeframe** segmented control:

```text
Timeframe:  [ Weeks ]  [ Months ]  [ Quarters ]   (default: Quarters)
```

- Switching timeframe re-buckets every item's date label (e.g. *"W23 2026"*, *"Jun 2026"*, *"Q2 2026"*) and re-renders the Gantt axis accordingly.
- The Now / Next / Later columns stay; only the date label and Gantt axis change.
- Each roadmap item gets a new **status** field with three values: `planned`, `in_progress`, `completed`. Default = `planned`.
- On every roadmap card (List + Kanban) and in the item dialog:
  - A small status pill ("Planned" / "In progress" / "Completed") that opens a dropdown to change status.
  - When set to **Completed**, the card gets a strikethrough title + muted styling + a green check, and a "Completed {date}" caption.
- The "Items by bucket" summary at the top gains a fourth count: *Completed: N*.
- Completed items are excluded from the Gantt timeline (they don't need to be scheduled anymore) but remain visible in List and Kanban so users have a history.

### Where the changes go

- `src/components/insightflow/roadmap.ts`
  - Add `type Status = "planned" | "in_progress" | "completed"`.
  - Add `status: Status` and `completedAt?: number` to `RoadmapItem`.
  - Add `type Timeframe = "weeks" | "months" | "quarters"`.
  - Add helpers: `weekOfYear(date)`, `formatWeek(d)`, `formatMonth(d)`, plus a generic `formatTimeframeLabel(quarter, tf)` that maps a Quarter → a label in the chosen timeframe (weeks/months derived from quarter start).
- `src/components/insightflow/roadmapStore.ts`
  - Extend `Override` with `status?: Status`, `completedAt?: number`.
  - Add `setStatus(id, status)` (also stamps/clears `completedAt`).
  - Bump `STORAGE_KEY` to `v6` with a one-time migration that defaults missing items to `planned`.
  - Persist `timeframe` preference under a separate key `insightflow.roadmap.timeframe`.
- `src/components/insightflow/RoadmapViewTabs.tsx` *(reused)* — add a sibling component `RoadmapTimeframeTabs` (don't bolt it into the existing tabs, keep View vs Timeframe visually distinct).
- `src/routes/roadmap.tsx`
  - Read/write `timeframe` from the new store entry; render the Timeframe control next to the existing View tabs.
  - Pass `timeframe` down to `RoadmapColumn`, `RoadmapKanban`, `RoadmapGantt`, `RoadmapItemCard` so they all label dates consistently.
  - Filter Gantt items to `status !== "completed"`.
- `src/components/insightflow/RoadmapItemCard.tsx` and `RoadmapItemDialog.tsx`
  - Render the status pill + dropdown; apply completed styling.
- `src/components/insightflow/RoadmapSummary.tsx` — add the Completed count.
- `src/components/insightflow/RoadmapGantt.tsx` — switch axis ticks based on `timeframe`.
- Cloud sync: `roadmap_overrides` is already a `jsonb` blob, so the new `status`/`completedAt` fields and timeframe ride along with the existing `saveRoadmap` call — no Supabase migration needed.

### Scope guard

No changes to: PRD panel, exports, analyze flow, the Now/Next/Later bucket semantics, drag-and-drop reordering, or the existing impact/effort/quarter controls. The Kanban/Gantt/List structure stays — only date labels, the new Timeframe selector, and the status pill are added.

---

## Out of scope (explicit)

- Landing page, Library list, auth, Supabase schema for sessions/projects/folders, Analyze input form, PRD generation, exports — all untouched.
- No new tables. `roadmap_overrides` jsonb absorbs the new fields.
