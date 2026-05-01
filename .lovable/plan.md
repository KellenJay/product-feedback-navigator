## Goal

Cut redundant interactions, fix priority color rules (P3 = green), make priority and bucket move together both ways across all views, and clean up small UI overlaps.

## 1. Remove all "X mentions" pop-ups (keep the number visible)

The mentions modal duplicates evidence already shown in-page (Analyze quotes, Roadmap "Show evidence", Roadmap detail dialog). Convert every clickable mentions pill back to a static `<span>`.

- `src/components/insightflow/ResultsView.tsx` — pill becomes a span; remove `mentionsIssue` state and `<MentionsDialog>`.
- `src/components/insightflow/RoadmapItemCard.tsx` — pill becomes a span; remove `mentionsOpen` state and `<MentionsDialog>`.
- `src/components/insightflow/RoadmapKanban.tsx` — pill becomes a span; remove `mentions` state, `onOpenMentions` prop, and `<MentionsDialog>`.
- Delete `src/components/insightflow/MentionsDialog.tsx` (no remaining importers).

## 2. P3 color = green (everywhere)

Today P3 uses muted gray. Switch to success-green and apply consistently.

A new helper in `src/components/insightflow/roadmap.ts`:

```ts
export function priorityClasses(p: "P1" | "P2" | "P3") {
  if (p === "P1") return "bg-destructive/15 text-destructive";
  if (p === "P2") return "bg-warning/15 text-warning";
  return "bg-success/15 text-success"; // P3
}
```

Replace inline priority class ladders (currently duplicated in `ResultsView.tsx`, `RoadmapItemCard.tsx`, `RoadmapItemDialog.tsx`, `RoadmapKanban.tsx`) with this helper.

In `ResultsView.tsx`, the P1/P2/P3 explainer tooltip: change the P3 line's `<span>` from `text-foreground` to `text-success` so the legend matches the pills.

## 3. Priority ↔ Bucket are linked, both directions

Today: changing the bucket re-buckets the item but `priority` (P1/P2/P3) stays frozen on the AI-derived value, so a "Now" card can still show P2.

Bucket→priority mapping (mirror of the existing `priorityToBucket`):
- now → P1, next → P2, later → P3.

Implementation:

- `src/components/insightflow/roadmap.ts`: add `bucketToPriority(b: Bucket): "P1"|"P2"|"P3"`.
- `src/components/insightflow/roadmapStore.ts`:
  - Extend `Override` with `priority?: "P1"|"P2"|"P3"` and `priorityUserSet?: boolean`.
  - In `setBucket`: if `!prev.priorityUserSet`, also set `priority = bucketToPriority(bucket)` (alongside the existing quarter recompute).
  - Add `setPriority(id, priority)`: stores `priority` + `priorityUserSet: true`, AND if `!prev.bucketUserSet` flips `bucket` to `priorityToBucket(priority)` (and recomputes quarter the same way `setBucket` does when `!quarterUserSet`). Add a `bucketUserSet` flag set when the user explicitly drags/picks a bucket so manual choices win.
  - In `useRoadmap`: apply `priority` override when present.
- Expose `setPriority` from `useRoadmap`.

Wire the new control:

- `src/components/insightflow/RoadmapItemCard.tsx`: add a `Priority` `<SelectControl>` next to Move/Effort/Quarter with options P1/P2/P3, calling `onPriority`.
- `src/routes/roadmap.tsx`: pass `setPriority` down to each `RoadmapItemCard` (mirror existing `onMove/onEffort/onQuarter` plumbing).
- `RoadmapKanban.tsx` already calls `onMoveBucket` on drop — no extra change; the store will sync priority automatically (and the card's priority pill will recolor across List/Kanban/Gantt because everything reads `item.priority` from the same hook).

Result: drag a card from Now→Next, P1 chip turns into yellow P2 everywhere; manually picking P3 in List moves it to Later (unless the user has pinned the bucket). User-pinned values are preserved via the `*UserSet` flags.

## 4. Dialog X-button no longer overlaps the Impact pill

Shared `RoadmapItemDialog.tsx` has the title row with the Impact pill on the right; the Radix `<Close>` X sits at `absolute right-4 top-4` and lands on top of the pill.

Fix in `src/components/insightflow/RoadmapItemDialog.tsx`:
- Add `pr-10` to the `DialogHeader` flex row (reserves ~40px so the pill clears the X).
- The pill stays right-aligned but inside the safe zone.

No change to the shared `dialog.tsx` (other dialogs are unaffected).

## 5. Gantt item-column titles: not clickable

In `src/components/insightflow/RoadmapGantt.tsx`, replace the title `<button>` in the Item column with a plain `<div>` (keep `line-clamp-2`, drop hover styling and the `setActive` handler). The Q-column bars remain clickable and continue to open `RoadmapItemDialog`.

## Files

**Edited**
- `src/components/insightflow/roadmap.ts` — add `bucketToPriority`, `priorityClasses` helpers.
- `src/components/insightflow/roadmapStore.ts` — link priority↔bucket overrides with `priorityUserSet` / `bucketUserSet` flags; expose `setPriority`.
- `src/components/insightflow/ResultsView.tsx` — static mentions span, drop dialog import/state, use `priorityClasses`, recolor P3 in tooltip.
- `src/components/insightflow/RoadmapItemCard.tsx` — static mentions span, drop dialog state, use `priorityClasses`, add Priority select.
- `src/components/insightflow/RoadmapKanban.tsx` — static mentions span, drop dialog/state/prop, use `priorityClasses`.
- `src/components/insightflow/RoadmapItemDialog.tsx` — `pr-10` header, use `priorityClasses`.
- `src/components/insightflow/RoadmapGantt.tsx` — non-clickable item title, use `priorityClasses` for `Bar` background (P3 = success).
- `src/routes/roadmap.tsx` — thread `setPriority` into `RoadmapItemCard`.

**Deleted**
- `src/components/insightflow/MentionsDialog.tsx`

## Out of scope (this turn)

- The Library tab (you'll move there after this lands).
- Any change to PDF/CSV exports — they already include full evidence per item.
