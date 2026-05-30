Three small UI fixes. No data, store, or business logic changes.

## 1. Onboarding strip: more visible + dismiss button

`src/components/onboarding/OnboardingStrip.tsx`
- Stronger container styling so it reads as a distinct bar instead of fading into the header: switch wrapper from `border-t border-border/60 bg-background/60` to a subtle tinted band — `border-y border-primary/20 bg-primary/[0.04]` with a faint inner shadow. Keeps the dark theme but clearly separates it from the TabBar above and page content below.
- Slightly larger pills: bump padding to `px-3 py-1.5` and text to `text-[12px]`. The "next" pill keeps the primary ring; done pills keep the muted emerald look.
- Add a small `X` (lucide `X` icon) button immediately to the right of the `2/6` counter. Clicking it calls `checklistStore.dismiss()` (already exists in the store, already persists `dismissed: true` to Supabase). Tooltip / aria-label: "Hide onboarding".
- Update the early-return guard so the strip also hides when `cl.row.dismissed` is true (today it only hides on `allDone`).

No changes to which steps exist, how they're marked complete, popover copy, or navigation targets.

## 2. Fix blue beam cutting through the Analyze/Roadmap/Library tabs

The `.hero-beam` element in `src/routes/app.tsx` lives inside the hero `<section>` but uses `inset: -120px 0 -80px 0` in `src/styles.css`, which makes the glow extend 120px *above* the section — right into the TabBar row. That's why the blue appears to slice through the tab labels.

Fix in `src/styles.css`:
- Change `.hero-beam` `inset` from `-120px 0 -80px 0` to `0 0 -80px 0` so the glow starts at the top of the hero section (just below the TabBar / OnboardingStrip), not above it.

This keeps the same look on `/` and `/roadmap` (those hero sections have enough headroom that the change is invisible) and removes the bleed on `/app` where the hero sits directly under the navigation.

No other styling, layout, or component changes.

## Files touched
- `src/components/onboarding/OnboardingStrip.tsx` — visibility tweak, X dismiss button, hide-when-dismissed.
- `src/styles.css` — `.hero-beam` inset adjustment only.