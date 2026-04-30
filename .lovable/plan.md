# Market Context Panel — Analyze Tab

## Scope confirmation
**Adding only**: one new "Market Context" panel that auto-loads beneath the existing "Top recommendations" card after analysis completes.
**Not touching**: hero, header, tab bar, input panel, metric cards, executive summary, prioritized pain points, recommendations, save/export bar, colors, spacing tokens, or fonts.

## One important deviation from the brief — please confirm or override
The brief specifies "Claude API with web search enabled." This project routes all AI through the **Lovable AI Gateway**, which exposes Gemini and GPT-5 models — **not Claude, and no web-search tool**. To stay consistent with the existing `analyze-feedback` function and avoid asking you for a new API key, I will:
- Use **`google/gemini-2.5-pro`** (best Gemini for multi-step reasoning + large context).
- Use **tool-calling for structured JSON** (same pattern as the existing function).
- The AI **synthesizes** competitor/news/trend signals from its training data — it cannot fetch live web data. Each item's `source` field will be an honest attribution (e.g. "Synthesized from public reviews & coverage, training data through 2025"), and the panel header will read **"MARKET CONTEXT · Auto-generated based on your analysis"** exactly as specified, with a small "Synthesized — not live web data" microcopy under the loader so users aren't misled.

If you want true live web data later, we'd add a Firecrawl or Perplexity connector — happy to do that as a follow-up.

## What gets built

### 1. New edge function: `supabase/functions/market-context/index.ts`
- POST body: `{ productName, businessGoal, topPainPoints: [{title, impactScore}, ...] }`
- Calls Lovable AI Gateway with `google/gemini-2.5-pro`, tool-calling for structured output.
- System prompt frames the model as "senior market research analyst, 20+ years SaaS." Instructs it to never fabricate URLs or specific dollar figures it isn't confident about (set `marketSize.confident=false` to skip rendering).
- Returns the exact JSON shape from the brief:
  ```
  { trends[], competitors[], news[], marketSize, verdict }
  ```
- Surfaces 429 / 402 errors with friendly messages (matches existing function).
- Registered in `supabase/config.toml` with `verify_jwt = false`.

### 2. New types in `src/components/insightflow/types.ts`
Add `MarketContext`, `TrendSignal`, `CompetitorSignal`, `NewsItem`, `MarketSize`, `Verdict` interfaces. No changes to existing types.

### 3. New component: `src/components/insightflow/MarketContextPanel.tsx`
Self-contained. Receives `productName`, `businessGoal`, `topPainPoints` as props. Owns its own fetch + loading/error state via `useEffect` so it fires automatically when results render. Layout, top to bottom, inside a single card matching `.rounded-xl border border-border bg-card p-5` (same as Executive Summary card):

- **Header**: `MARKET CONTEXT · Auto-generated based on your analysis` — reuses the existing `<SectionLabel>` style (11px uppercase, tracking-wider, `text-foreground-muted`).
- **Loading state**: 3 shimmer rows using the existing `Skeleton` component from `@/components/ui/skeleton` + caption "Pulling market signals, competitor activity, and industry trends…" in 13px `text-foreground-muted`. Subcaption "Synthesized from AI training data" in 11px.
- **Component 1 — Trend signals**: 12px uppercase label + 2–3 rows. Each row: 14px statement, CSS triangle indicator (▲ growing → `text-warning` to match coral-ish amber, ▼ declining → `text-foreground-muted`, → stable → `text-primary`), 11px source line.
- **Component 2 — Competitive landscape**: 3-row table, no outer borders, only `border-b border-border/50` per row. Columns: Competitor / How they address this / Signal. Signal cell = 8px `rounded-full` dot (`bg-success` / `bg-warning` / `bg-destructive`) + word.
- **Component 3 — Industry news · Last 90 days**: 3–4 list rows separated by `border-b border-border/50`. Headline 13px weight 500, summary 13px muted, right-aligned `source · date` in 11px.
- **Component 4 — Market sizing** (conditional on `marketSize.confident === true`): single inline row in a `bg-surface rounded-md px-3 py-2` strip, 13px muted.
- **Component 5 — Verdict card**: full-width, 3px solid left border only (no fill). Border + label color mapping:
  - `validates` → `border-success` + `text-success`
  - `mixed` → `border-warning` + `text-warning`
  - `contradicts` → `border-destructive` + `text-destructive`
  - 15px weight-500 label, 14px muted rationale (line-height 1.7), bottom-right "How was this determined? ↗" link that toggles a collapsed `<details>` showing `verdict.reasoning` in `font-mono text-xs`.
- **Error state**: small inline message + Retry button. 429/402 surfaced as toasts via `sonner` (matches existing pattern).

### 4. Wire into `src/routes/index.tsx`
Below `<ResultsView />`, add:
```tsx
{result && (
  <MarketContextPanel
    productName={productName}
    businessGoal={businessGoal}
    topPainPoints={result.issues.slice(0, 3).map(i => ({ title: i.title, impactScore: i.impactScore }))}
  />
)}
```
Same fade-in container styling as `ResultsView` so it joins the animation sequence visually.

### 5. Stub interactions
"How was this determined?" expands inline (no API). No save/export added for this panel — out of scope per brief.

## Design-token compliance check
Only existing tokens used: `border`, `card`, `surface`, `foreground`, `foreground-muted`, `primary`, `success`, `warning`, `destructive`, `muted`. No new colors, no new fonts, no new radii. Card style, label style, and spacing match what's already in `ResultsView.tsx`.

## Files touched
- **New**: `supabase/functions/market-context/index.ts`
- **New**: `src/components/insightflow/MarketContextPanel.tsx`
- **Edit**: `src/components/insightflow/types.ts` (additive only)
- **Edit**: `src/routes/index.tsx` (one mount point below ResultsView)
- **Edit**: `supabase/config.toml` (register new function with `verify_jwt = false`)

## Out of scope (explicitly not touched)
Roadmap tab, Library tab, auth, save/export for market context, any restyling of existing components.
