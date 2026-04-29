# Plan — Dark mode polish + source attribution + priority legend

Three focused changes. Keeping the layout, spacing, and component structure as-is — only refining what you flagged.

## 1. Dark mode — "GoDaddy-after-dark" palette

Switch the app to dark by default with a confident, branded palette. Inspiration: GoDaddy's signature teal-green + warm coral, set against a deep neutral.

**New tokens (in `src/styles.css`):**
- Background: deep near-black with a warm tint — `#0E1116` (not pure black, easier on eyes)
- Surface / cards: `#161B22` with a 1px hairline border at `rgba(255,255,255,0.06)`
- Foreground: `#F2F4F7`, muted `#8B95A7`
- **Primary (action / brand):** keep the InsightFlow green but lifted for dark — `#1FB283` (a brighter cousin of the current `#1D9E75`)
- **Accent (hero highlight, links, badges):** GoDaddy coral `#FF6B5C` used sparingly as the secondary accent
- Sentiment colors retuned for dark: success `#34D399`, warning `#FBBF24`, destructive `#F87171`, info `#60A5FA`

The `.dark` class becomes the default — `<html>` gets `class="dark"` so we don't fight the existing `@custom-variant dark` setup.

## 2. Hero section — more dynamic, still clean

Today the hero is just a centered H1 + paragraph. Upgrades:

- **Animated gradient backdrop** behind the headline: a soft radial gradient (primary green → coral → transparent) with a slow `animate-pulse`-style drift. CSS-only, no library.
- **Eyebrow chip** above the H1: a small pill — "AI feedback intelligence for PMs" — with a subtle dot indicator.
- **Headline treatment:** keep the copy, but apply a gradient text fill on the phrase "prioritized roadmaps" so the eye lands on the value prop.
- **Subtle grid / noise overlay** (CSS background with `radial-gradient` dots at 4% opacity) for texture — gives that "modern SaaS" depth without being busy.
- **Trust micro-row** under the subhead: three tiny inline stats separated by dots, e.g. `Reddit · Capterra · G2 · CSV · PDF` — signals what InsightFlow ingests.

No hero image, no illustration — keeps it senior and restrained.

## 3. Source attribution on quotes (your "where did this come from" idea)

You're right that we don't want to push users off-platform, so we'll **show source context, not exit links** for now. Each quote in a pain point gets a small attribution line:

```text
"Setup took me 4 hours and I still couldn't get SSL working."
— Reddit · r/godaddy · 2 weeks ago
```

**How:**
- Extend the `Issue.quotes` type from `string[]` to a richer shape: `{ text: string; source?: string; context?: string; date?: string; url?: string }[]`. Backwards-compatible — if the AI returns plain strings, we render as before.
- Update the edge function's tool schema so the model returns source metadata when it can infer it (e.g., the input mentions "Reddit post" or the upload is a CSV with a source column). We instruct it to leave fields `null` rather than fabricate.
- In `ResultsView`, render the attribution as a muted caption below each quote. If a `url` exists, show a small "View source ↗" affordance in coral — opens in a new tab (`target="_blank"`, `rel="noopener"`) so the user doesn't lose their analysis. This is opt-in per-quote, not a primary action.

This gives the reference value you described without yet building the full "jump to comment + reply" flow (which belongs in a future "Engage" feature — flagging for later).

## 4. Priority legend (P0 / P1 / P2)

Add a small **info tooltip** next to the "Prioritized pain points" section header. Hovering / tapping the `(i)` icon reveals:

- **P0** — Critical. Blocks core use or causes churn. Fix this sprint.
- **P1** — High. Significant friction for many users. Next 1–2 sprints.
- **P2** — Medium. Quality-of-life. Backlog candidate.

Uses the existing shadcn `Tooltip` component (already in the project). No settings page needed — the definition lives where the labels appear.

## What I'm NOT changing

- Layout, spacing, typography scale, component structure
- Input panel logic, file upload, edge function flow
- Tab bar, "coming soon" stubs for Roadmap / Library
- The metric cards, executive summary block, recommendations block — all stay

## Files touched

- `src/styles.css` — palette swap, default to dark, hero gradient utility
- `src/routes/__root.tsx` — add `className="dark"` to `<html>`
- `src/routes/index.tsx` — hero section markup (eyebrow, gradient text, trust row)
- `src/components/insightflow/types.ts` — richer `Quote` type
- `src/components/insightflow/ResultsView.tsx` — quote attribution rendering, priority tooltip
- `supabase/functions/analyze-feedback/index.ts` — extend tool schema for quote sources, prompt update

Ready to build when you approve.