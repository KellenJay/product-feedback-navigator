## Goals

1. Remove the visible scroll arrows/scrollbar that appear next to "Library" on the top tab bar (caused by `overflow-x-auto` on `TabBar.tsx`). Tabs should still be reachable on small screens, but with no visible scroll UI on any device.
2. Add a lightweight onboarding flow for first-time signed-in users: a 3-question questionnaire + a checklist-style guided tour across Analyze, Roadmap, and Library.

Paywall is mentioned but explicitly **out of scope** for this round — the user pivots to onboarding. I'll flag it as a follow-up.

## 1. Fix the tab bar scroll indicator

`src/components/insightflow/TabBar.tsx` uses `overflow-x-auto` on the tabs row, which renders a native scrollbar (the "up/down arrow" the user sees is the browser's scrollbar arrow buttons on certain OSes).

Change:
- Replace `overflow-x-auto` with a custom `no-scrollbar` utility (hides scrollbar on all platforms) while keeping horizontal scrollability for very narrow viewports.
- Add a `.no-scrollbar` utility in `src/styles.css`:
  ```css
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  ```
- At the current 928px viewport, all three tabs fit comfortably — no scrolling needed; the scrollbar simply disappears.

No copy or behavior changes.

## 2. Onboarding flow

Two pieces, both gated to first-time users only (tracked in a new `profiles.onboarding_state jsonb` column).

### 2a. Questionnaire modal (shown once, right after first login)

Modal with 3 questions, "Skip for now" allowed:

1. **What's your role?** — single select: PM / Founder / Designer / Engineer / Other
2. **How big is your team?** — single select: Just me / 2–10 / 11–50 / 50+
3. **How did you hear about us?** — single select: Twitter / LinkedIn / Friend / Search / Other (with free-text when "Other")

Answers saved to `profiles.onboarding_state.survey`. Used later for light personalization (e.g. greeting copy in the Analyze hero); no behavior branching in this round.

### 2b. Checklist tour (persistent until completed/dismissed)

A small floating card (bottom-right, collapsible) showing 3 checklist items:

- ☐ **Run your first analysis** — completes when the user successfully runs an analysis on `/app`.
- ☐ **Open the Roadmap** — completes on first visit to `/roadmap`.
- ☐ **Save to your Library** — completes when an entry first appears in `libraryStore` for this user.

Each item has a short one-liner ("Paste feedback or upload a CSV — we'll cluster pain points") and a CTA button that routes to the relevant page. When all 3 are checked, card auto-collapses into a "🎉 You're all set" state with a "Dismiss" button.

Trigger for completion events: hook into existing stores (`analyzeStore`, `libraryStore`) and route changes (`useLocation` for `/roadmap`) — no changes to the existing analyze/roadmap/library logic.

Progress is persisted to `profiles.onboarding_state.checklist`.

### Files

New:
- `src/components/onboarding/OnboardingSurveyDialog.tsx` — 3-question modal
- `src/components/onboarding/OnboardingChecklist.tsx` — floating checklist card
- `src/components/onboarding/onboardingStore.ts` — Zustand-style singleton store, syncs to Supabase `profiles.onboarding_state`
- `src/components/onboarding/useOnboardingProgress.ts` — wires `analyzeStore`/`libraryStore`/route changes into checklist completion

Edited:
- `src/components/insightflow/TabBar.tsx` — replace `overflow-x-auto` with `overflow-x-auto no-scrollbar`
- `src/styles.css` — add `.no-scrollbar` utility
- `src/routes/__root.tsx` (or `app.tsx` if root is too broad) — mount `<OnboardingSurveyDialog />` and `<OnboardingChecklist />` for authenticated users
- `src/routes/app.tsx`, `src/routes/roadmap.tsx`, `src/routes/library.tsx` — call `useOnboardingProgress()` to mark steps

### Database

Add `onboarding_state jsonb default '{}'::jsonb` to existing `profiles` table. RLS already restricts profile reads/writes to the owner, so no new policies needed.

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_state jsonb NOT NULL DEFAULT '{}'::jsonb;
```

### Out of scope

- **Paywall** — flagged for a follow-up turn. Will need a separate decision on provider (Lovable's built-in Stripe/Paddle) and what the gated features are.
- No changes to Analyze, Roadmap, or Library page internals.
- No A/B-testing infra or analytics events beyond what already exists.
- No tooltips/spotlight tour (the checklist replaces this — the user described a checklist, not a Shepherd.js-style spotlight).

## Open question

The user mentioned a paywall and onboarding in the same breath but then said "just do that" about onboarding. I'll ship onboarding + the tab bar fix in this plan. Want me to spec the paywall (which features are gated, free quota, pricing tiers) in a follow-up plan?
