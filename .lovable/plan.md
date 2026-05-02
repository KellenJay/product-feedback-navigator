## Roadmap List Card refinements

Three small visual changes to each ticket card on the Roadmap → List view (`src/components/insightflow/RoadmapItemCard.tsx`). Bucket→Priority sync stays as-is, so the "Move to" dropdown remains the single control that drives P1/P2/P3 and red/yellow/green.

### 1. Make the priority pill static (not a dropdown)

- Remove the `PillSelect` for priority and replace it with a plain `<span>` styled with `priorityClasses(item.priority)`.
- Keeps the colored pill (red P1 / yellow P2 / green P3) and the label, but no chevron, no `<select>`, not clickable.
- Drop the now-unused `onPriority` prop from the card (and stop passing it from `RoadmapColumn` / `roadmap.tsx`).
- Result: the only way to change priority on the list view is "Move to → Now/Next/Later", which already cascades to P1/P2/P3 + color via `roadmapStore.setBucket`.

### 2. New neutral color for the Category (themes) pill

- Today the category pill uses `bg-accent/15 text-accent`, which clashes with the blue quarter pill.
- Change to a neutral, slightly-tinted slate that reads as "tag" without competing with red/yellow/green (priority), blue (quarter), or gray (mentions).
- Use existing tokens: `bg-foreground/5 text-foreground border border-border/60`. This sits one step above the gray "mentions" pill in contrast, so the row reads: priority (color) → quarter (blue) → category (soft slate, bordered) → mentions (flat gray) → effort (outlined).

### 3. Simplify the Effort pill

- Display: `Effort S`, `Effort M`, `Effort L` (capital letter, single space, no colon, no word).
- Dropdown options: show just `S`, `M`, `L` (drop "Small/Medium/Large" from the menu).
- Achieved by changing the `display` prop to `` `Effort ${item.effort}` `` and the option labels to the raw letter.
- `EFFORT_META` labels stay intact (still used by exports / markdown / Kanban / Gantt) — only the list card's UI strings change.

### Files touched

- `src/components/insightflow/RoadmapItemCard.tsx` — replace priority PillSelect with static span; recolor category pill; update effort display + option labels; remove `onPriority` from props.
- `src/components/insightflow/RoadmapColumn.tsx` — stop forwarding `onPriority` to the card.
- `src/routes/roadmap.tsx` — `RoadmapColumn` call no longer needs `onPriority` (store function stays for Kanban/Gantt).

No changes to Kanban, Gantt, dialogs, store, exports, or types.
