# Public landing page at `/`, app moves to `/app`

## Scope guarantee

No changes to: Analyze logic, Roadmap, Library, Account, auth flow, Supabase tables, edge functions, TabBar internals, or any business logic. Only route paths and a new marketing page are touched.

## Routing changes

1. **Move current home to `/app`**
   - Rename `src/routes/index.tsx` → `src/routes/app.tsx` and change `createFileRoute("/")` → `createFileRoute("/app")`. All component logic stays identical.
   - Update `TabBar.tsx` Analyze tab `to="/"` → `to="/app"`.
   - Update `src/lib/authGuard.ts` default redirect target so post-login lands on `/app` (change the `redirect` search default consumer in `login.tsx` from `"/"` to `"/app"`).
   - Update `login.tsx` `beforeLoad` redirect fallback from `"/"` to `"/app"` so authed users hitting `/login` go to the app.
   - Audit and update any other internal `to="/"` / `navigate({ to: "/" })` references (library, roadmap, account, ResultsView, etc.) that mean "the analyze page" → `"/app"`.

2. **New public landing at `/`**
   - Create `src/routes/index.tsx` as the marketing page.
   - `beforeLoad`: if a Supabase session exists, `throw redirect({ to: "/app" })` so authenticated users auto-bounce into the app. Logged-out visitors see the landing.
   - No `requireAuth`. Public route.

## Landing page

Single-file route component using existing design tokens only — no new colors, no Courier New, no teal. Reuses:
- `bg-background`, `text-foreground`, `text-foreground-muted`, `border-border`, `bg-surface`, `bg-primary`, `text-primary`, `text-primary-foreground`
- Existing `.font-display` (JetBrains Mono) for headlines, default DM Sans for body
- Existing `.hero-beam`, `.hero-grid`, `.text-gradient-brand`, `.btn-glow`, `.card-halo` utilities (already in `styles.css`) to mirror the current Analyze page aesthetic

Sections (in order, matching the brief's structure but with our tokens):

1. **Sticky nav** — `InsightFlow` wordmark left; `Log in` (ghost) + `Get started free` (primary) right. Both link to `/login`.
2. **Hero** — eyebrow pill ("AI-powered product intelligence"), two-line `.font-display` headline with `.text-gradient-brand` on the second line, subheadline in `text-foreground-muted`, two CTAs (primary → `/login`, secondary → `#how-it-works` smooth scroll), social proof line. Uses the existing `.hero-beam` + `.hero-grid` background.
3. **Hero visual** — styled mock card (pure JSX/CSS, no images) showing 3 ranked pain-point rows with impact scores + a green-bordered verdict card, framed with `.card-halo`.
4. **Trust bar** — single line + 4 outlined persona pills (Startup founders / Product managers / SMB owners / Growth & marketing).
5. **Problem → Solution** — 2-column grid; left = problem copy, right = 4 feature rows with left-border accent.
6. **How it works** (`id="how-it-works"`) — 3 numbered cards.
7. **Feature highlights** — 3 alternating rows, each with copy + a styled mock card.
8. **Who it's for** — 2×2 grid of persona cards.
9. **Closing CTA** — large headline + single primary button → `/login`.
10. **Footer** — 3 columns (brand/tagline/copyright • product links • built-with line).

Subtle motion only: fade-in on hero (CSS transition triggered on mount), `IntersectionObserver`-based fade+translateY for section reveals. Fully responsive (stacks at <768px, headline scales down).

## SEO

`head()` on `/`: title "InsightFlow — Turn customer feedback into prioritized roadmaps", description, og:title/og:description, single H1 in hero. The existing `/app` route keeps its own head metadata.

## Files

- **Create**: `src/routes/index.tsx` (new landing page)
- **Create**: `src/routes/app.tsx` (moved from old `index.tsx`, identical body, path `/app`)
- **Delete**: old `src/routes/index.tsx` (replaced)
- **Edit**: `src/components/insightflow/TabBar.tsx` (Analyze tab `to="/app"`)
- **Edit**: `src/routes/login.tsx` (default redirect target `/app`)
- **Edit**: any other route/component with hardcoded `to="/"` meaning the analyze page (grep first; likely `library.tsx`, `roadmap.tsx`, `account.tsx`, `ResultsView.tsx`, `AnalysisFooter.tsx`, `LibraryEntryDialog.tsx`)

`routeTree.gen.ts` regenerates automatically — not edited by hand.

## Verification

- Logged out: visiting `/` shows landing; `/app`, `/library`, `/roadmap`, `/account` redirect to `/login`.
- Logged in: visiting `/` auto-redirects to `/app`; TabBar Analyze tab points to `/app`; all existing flows (analyze → market context → roadmap → PRD → library save/open) work unchanged.
- Build passes; no console errors.
