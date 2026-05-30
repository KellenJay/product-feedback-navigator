The beam already starts at the top of the hero `<section>`, but `<main>` has `pt-8 sm:pt-12` padding above it, leaving a visible gap between the nav/onboarding strip and where the blue starts.

Fix in `src/routes/app.tsx` only:

- Remove the top padding from `<main>`: change `pt-8 sm:pt-12` to no top padding (keep `pb-24` and horizontal padding).
- Push the hero text down by the same amount via the eyebrow element instead: add `mt-8 sm:mt-12` to the eyebrow pill (the first child inside the hero section) so headline spacing is unchanged.

Result: the hero section — and therefore `.hero-beam` (which uses `inset: 0 0 -80px 0`) — now begins flush against the bottom of whatever sits above it. When the OnboardingStrip is visible, the beam starts right under the strip; when it's dismissed and the strip unmounts, the beam starts right under the Analyze / Roadmap / Library row.

No changes to the OnboardingStrip, TabBar, hero-beam CSS, or any other route.

## Files touched
- `src/routes/app.tsx` — main padding + eyebrow margin only.