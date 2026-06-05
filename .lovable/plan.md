## Goal

Remove the marketing hero copy on the Analyze and Library pages so each page jumps straight to its functional UI. Keep the blue beam backdrop.

## Changes

### 1. `src/routes/app.tsx` (Analyze page)
In the hero `<section>` (around lines 230–256), remove:
- Eyebrow pill ("AI feedback intelligence")
- `<h1>` ("Stop drowning in feedback. / Start shipping what matters")
- `<p>` ("InsightFlow turns scattered user signals…")

Keep the `<section className="relative isolate text-center">` wrapper with the `hero-beam` and `hero-grid` divs so the blue beam still renders behind the input. Remove the now-unused top margin scaffolding and drop the `mt-8` on the InputPanel wrapper so spacing under the TabBar stays tight (the beam continues to anchor right under the tabs, matching current behavior).

### 2. `src/routes/library.tsx` (Library page)
In the hero `<section>` (around lines 165–187), remove:
- Eyebrow pill ("Your research library")
- `<h1>` ("Every insight, on tap")
- `<p>` ("Save the analyses worth keeping…")

Keep the `hero-beam` + `hero-grid` divs inside the section. Preserve existing spacing rules from the prior fix (beam flush under TabBar / onboarding strip) so the library content/sidebar starts cleanly below the beam.

### 3. Roadmap page
No change — user confirmed it's good as-is.

## Notes
- The beam stays. It's a CSS-positioned background (`hero-beam`), not tied to the headline text.
- No store, routing, or business-logic changes.
