# Analyze page: add User Feedback / Idea Validation sub-tabs

Add a two-tab switcher directly above the input card on `/app`, between the main `TabBar` (Analyze / Roadmap / Library) and the `InputPanel`. Both tabs reuse the exact same input mechanic (paste / upload / deep research) and the same analyze pipeline — only the framing labels and the prompt context change.

## Tabs

1. **User Feedback** (default — current behavior, unchanged)
   - "Product name" / "Business goal (optional)"
   - Placeholders as today (e.g. "e.g. Notion", "reduce churn…")

2. **Idea Validation** (new framing of the same form)
   - "Idea name" — placeholder "e.g. Fitness app for overweight teenagers"
   - "Who is it for / why (optional)" — placeholder "e.g. help overweight teens build sustainable habits"
   - Same three input modes: Paste feedback, Upload document, Deep research
     - Paste placeholder: "Paste forum threads, Reddit discussions, comments, or notes about this problem space…"
     - Deep research placeholder: "e.g. what teens say about fitness apps on Reddit, TikTok comments, App Store reviews"
   - CTA label: "Validate idea" (vs. "Analyze feedback")

## Behavior

- Tab choice persists in `analyzeStore` as `intent: "feedback" | "idea"` (default `"feedback"`).
- Switching tabs does NOT clear the user's entries — values carry over since the underlying fields are the same.
- On submit, the same `analyze-feedback` edge function is called. We pass `intent` in the body so the prompt can lightly reframe results for an unvalidated idea (e.g. "pain points in this problem space" vs "issues with this product"). No schema changes — the `AnalysisResult` shape stays identical, so Results, Roadmap, PRD, Market Context, Library all keep working unchanged.
- Library entries record `intent` so reopening an entry restores the right tab. Existing entries default to `"feedback"`.

## Files to change

- `src/components/insightflow/types.ts` — add `Intent = "feedback" | "idea"`.
- `src/components/insightflow/analyzeStore.ts` — add `intent` to state (default `"feedback"`), include in `reset`.
- `src/components/insightflow/IntentTabs.tsx` *(new)* — small pill switcher styled to match existing TabBar / mode pills.
- `src/components/insightflow/InputPanel.tsx` — accept `intent` prop; swap field labels, placeholders, helper copy, and CTA label based on it. No structural changes.
- `src/routes/app.tsx` — render `<IntentTabs />` above `<InputPanel />`; pass `intent` to `InputPanel`; include `intent` in the `supabase.functions.invoke("analyze-feedback", { body: { …, intent } })` call and in `libraryStore.recordAnalysis(...)`.
- `src/components/insightflow/libraryStore.ts` — persist `intent` on entries (optional, defaults to `"feedback"` for back-compat).
- `supabase/functions/analyze-feedback/index.ts` — read optional `intent`; when `"idea"`, adjust system prompt wording (problem space / unvalidated idea framing) while returning the same JSON schema.

## Out of scope

- No changes to Roadmap, Library, PRD, Market Context UIs.
- No new result fields or schema migrations.
- Visual placement of the main TabBar and input card stay as-is.
