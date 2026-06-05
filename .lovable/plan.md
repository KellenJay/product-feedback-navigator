## Goal

1. Make the blue "hero beam" backdrop look identical on Analyze, Roadmap, and Library — anchored directly under the TabBar.
2. Stop long text (e.g. a wordy "Top pain area") from spilling outside KPI cards and any other result card on the Analyze and Roadmap pages.

## Changes

### 1. Shared HeroBeam component
Create `src/components/insightflow/HeroBeam.tsx`:
- Renders the existing `.hero-beam` + `.hero-grid` divs inside a fixed-height `relative isolate` wrapper (`h-[180px]`, `-mb-[140px]` so following content overlaps into the glow exactly like Analyze today).
- Single source of truth — guarantees identical placement and size on every page.

No CSS changes needed; `.hero-beam` / `.hero-grid` in `src/styles.css` already define the look. The wrapper sizing fixes the "weird" Library beam (today its zero-height parent leaves only a thin sliver visible).

### 2. Use HeroBeam on all three pages
- `src/routes/app.tsx` — replace the current inline beam `<section>` with `<HeroBeam />` directly under `<TabBar />`. Keep the `mt-8 sm:mt-12` on the InputPanel wrapper.
- `src/routes/library.tsx` — replace the inline beam `<section>` with `<HeroBeam />` directly under `<TabBar />` (before `EmptyState` / grid). Keeps existing spacing.
- `src/routes/roadmap.tsx` — add `<HeroBeam />` directly under `<TabBar />`, above `<main>`. Remove the inline beam currently nested inside `RoadmapBody`'s hero section (so the beam now shows on the empty state too, matching the other pages). Leave the rest of the roadmap hero text intact.

### 3. KPI / result card overflow fixes
- `src/components/insightflow/ResultsView.tsx`
  - `Metric` value: switch from fixed `text-[22px]` to a fluid clamp (`text-[clamp(15px,2.6vw,22px)]`), add `break-words leading-snug`, and on the long-prone "Top pain area" allow 2-line wrap (`line-clamp-2`) with a `title` tooltip showing the full string.
  - Issue card: ensure header row uses `min-w-0` on the title container and `break-words` on the `<h3>` so long titles don't push the Impact pill off-card.
  - Tag row: already wraps; confirm `truncate` is not applied to category text.
  - Recommendations: add `min-w-0 break-words` to the text block so long titles wrap cleanly.
- `src/components/insightflow/RoadmapSummary.tsx`
  - `Stat` value: same fluid clamp + `break-words leading-snug`; ensure card has `min-w-0`.

No business-logic or data changes; purely presentation.

## Notes
- Beam stays a CSS-positioned background, no JS.
- `min-h-0` / `min-w-0` are required on flex/grid children to let `break-words` actually wrap inside fixed-width cards.
- Roadmap page's existing hero text (eyebrow pill, headline, subcopy) stays — the user only asked to add the beam there, not strip copy.
