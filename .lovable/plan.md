# Onboarding Checklist — Relocate & Make Interactive

Scope: only the onboarding checklist UI/behavior. No changes to data model, store logic, completion-tracking rules, or any other feature.

## What changes

1. **Remove** the floating bottom-right launcher (`ChecklistLauncher`) from its current placement. Mount in `__root.tsx` is replaced by a new strip component rendered inside the app shell.

2. **New component** `OnboardingStrip.tsx` — a horizontal bar that sits **directly under the `TabBar`** on the three core app routes (`/app`, `/roadmap`, `/library`). Placed inside each route just below `<TabBar />` (or, simpler, rendered by `TabBar` itself as a second row so it stays glued to the nav).

3. **Strip layout** (single row, scrolls horizontally on mobile, hidden scrollbar):
   - 6 pill-style items in order: Account, Profile, Company, Analysis, Roadmap, Library.
   - Each pill shows: small circle/check icon + short label + (if done) muted line-through.
   - Done items get a filled check (emerald); current/next item gets a subtle highlighted ring.
   - Progress text on the right: `2 / 6 complete`.

4. **Click behavior** — each pill is a button that opens a small **Popover** (shadcn `popover`) anchored to the pill containing:
   - One-sentence description of what that step is (e.g. "Analyze turns raw user feedback into themes, pains, and feature ideas.").
   - A primary action button: **"Take me there"** (label varies per step: "Open Analyze", "Open Roadmap", "Open Library", "Edit profile", "Add a company"; Account step is already done so just shows "Done").
   - Clicking the action navigates to the relevant route (`/app`, `/roadmap`, `/library`, `/account`) and closes the popover.
   - **Does NOT mark the step complete on click.** Completion still only happens via the existing auto-detection in `checklistStore` (running an analysis, opening roadmap with results, saving to library, etc.). User confirmed: clicking should not force-complete.

5. **Auto-hide when complete** — when `allDone` is true, the strip unmounts entirely (no "you've completed" card, no dismiss button, no share button — user said it should just disappear). The dismissed-state machinery in the store stays in place but is no longer user-facing.

6. **Visibility rules** — strip only renders on `/app`, `/roadmap`, `/library` (the routes that already render `TabBar`). It is not shown on `/login`, `/`, `/onboarding`, `/account`, `/auth/*`, `/reset-password`.

## Step copy (one sentence each)

- **Account** — "Your account is set up — you're signed in and ready to go."
- **Profile** — "Add your name, photo, and role so your workspace feels like yours." → Edit profile → `/account`
- **Company** — "Add the product or company you're working on so analyses and roadmaps stay organized." → Add a company → `/account`
- **Analysis** — "Paste reviews, transcripts, or notes and turn them into themes, pains, and feature ideas." → Open Analyze → `/app`
- **Roadmap** — "Generate a prioritized roadmap with epics and user stories from your analysis." → Open Roadmap → `/roadmap`
- **Library** — "Save analyses to your library so you can come back to them anytime." → Open Library → `/library`

## Files touched

- **New**: `src/components/onboarding/OnboardingStrip.tsx` — the bar + popover UI, reads `useChecklist()`.
- **Edit**: `src/components/insightflow/TabBar.tsx` — render `<OnboardingStrip />` as a second row directly below the existing tabs row (same `max-w-[780px]` container, thin top border separator) so it appears under Analyze/Roadmap/Library on every app route automatically.
- **Edit**: `src/routes/__root.tsx` — remove `<ChecklistLauncher />` mount.
- **Delete**: `src/components/onboarding/ChecklistLauncher.tsx` (no longer used).

`checklistStore.ts`, the migration, the auto-mark effects, and `onboarding.tsx` are **not touched**. The auto-mark logic that lives in `ChecklistLauncher` (analysis/roadmap/library detection effects) is moved verbatim into `OnboardingStrip` so completion still gets recorded.

## Out of scope

- No changes to which actions count as "completed".
- No changes to the 5-step onboarding flow at `/onboarding`.
- No changes to company switcher, account page, or any data.
