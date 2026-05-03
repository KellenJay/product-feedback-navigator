# Add Auto-Generated PRD Section to Roadmap

Below the roadmap views, add a **Product Requirements Document** panel that's generated automatically (no extra button) from the current roadmap output, rendered collapsed by default with tabs, PDF export, and copy-to-clipboard.

## Note on the AI provider
The spec says "Claude API call." This project uses **Lovable AI** (built-in, no key required) — calling Claude directly would require the user to add an Anthropic API key. I'll use Lovable AI (`google/gemini-3-flash-preview` by default, or `openai/gpt-5` for stronger structured reasoning) with the **exact system prompt you provided**, returning the same JSON schema. If you'd rather pay/connect Anthropic specifically, say so and I'll swap the provider.

## What gets built

### 1. New edge function: `generate-prd`
- Path: `supabase/functions/generate-prd/index.ts` (+ `verify_jwt = false` in `supabase/config.toml`).
- Input: `{ productName, businessGoal, roadmapItems }`.
- Calls Lovable AI Gateway with the verbatim system prompt from the request and the roadmap serialized as the user message.
- Uses **tool calling** (`submit_prd`) with a JSON schema mirroring the PRD shape (prd.title/version/status/overview/problemStatement/goals/nonGoals/epics[…userStories[…acceptanceCriteria, designNotes, devNotes, estimatedEffort S|M|L|XL, priority P1|P2|P3]]/executionGuide[…]/successMetrics/openQuestions).
- Handles 429 / 402 with friendly messages, same as `analyze-feedback`.

### 2. New types & store
- `src/components/insightflow/prd.ts` — TypeScript types for the PRD JSON.
- `src/components/insightflow/prdStore.ts` — small store keyed by analysis (uses `useAnalyzeStore` result as input signal). Caches the latest PRD in memory + localStorage so it persists across navigation. Exposes `{ prd, status: "idle"|"loading"|"ready"|"error", error, regenerate() }`.
- Auto-trigger: when `RoadmapBody` mounts with a `result` and there's no cached PRD for that result hash, fire the generation in the background. Roadmap renders immediately; PRD card shows skeleton until ready.

### 3. New UI: `PRDPanel.tsx` (+ subcomponents)
Mounted in `src/routes/roadmap.tsx` directly under the existing roadmap views (above `RoadmapFooter`). Width matches the 780px column.

**Header bar (always visible):**
- Left: `Product Requirements Document · v1.0 · Draft` (status pill colored).
- Right: `View full PRD ↓` / `Collapse ↑` toggle, `Export PDF`, `Copy`.
- While loading: header shows shimmer + "Drafting PRD…"; while errored: shows Retry.

**Collapsed:** just the header bar (matches existing card styling — `rounded-2xl border bg-surface`).

**Expanded:** tab bar reusing the look of `RoadmapViewTabs`, with 4 tabs:

1. **Overview** — title, version pill, status pill, overview paragraph, problem statement, numbered goals list, non-goals as muted/strikethrough list.
2. **Epics & User Stories** — each epic = card with ID, title, description, businessValue. Stories below are collapsible rows (Radix `Collapsible`) showing: ID + title, italic "As a… I want… so that…", acceptance criteria as visual unchecked checkboxes (Given/When/Then), design notes in blue-left-bordered callout, dev notes in purple-left-bordered callout, Effort + Priority pills (reusing `priorityClasses` from `roadmap.ts` and a parallel `effortClasses` helper).
3. **Execution Guide** — per phase: card with sprint, focus, task list, dependencies, risks, then a distinct "PM Recommendation" surface box (`bg-primary/5 border-l-4 border-primary` with subtle icon) for `recommendedApproach`.
4. **Success Metrics & Open Questions** — numbered metrics list with a static target value column; open questions list with an amber `Unresolved` pill.

### 4. Export & copy
- `src/components/insightflow/exportPrdPdf.ts` — new jsPDF builder; renders all 4 tabs sequentially with section headers, callouts as colored blocks, pills as filled rects. Filename: `{productName}-prd.pdf`.
- Copy: serializes PRD as structured plain text (markdown-ish: `# Title`, `## Epic E1 — …`, `### Story E1-S1`, AC as `- [ ] …`, etc.) and writes to clipboard with a sonner toast — same UX as the existing roadmap copy.

## Files

**New:**
- `supabase/functions/generate-prd/index.ts`
- `src/components/insightflow/prd.ts`
- `src/components/insightflow/prdStore.ts`
- `src/components/insightflow/PRDPanel.tsx`
- `src/components/insightflow/PRDOverview.tsx`
- `src/components/insightflow/PRDEpics.tsx`
- `src/components/insightflow/PRDExecution.tsx`
- `src/components/insightflow/PRDMetrics.tsx`
- `src/components/insightflow/exportPrdPdf.ts`

**Edited:**
- `supabase/config.toml` — register `generate-prd` with `verify_jwt = false`.
- `src/routes/roadmap.tsx` — render `<PRDPanel />` above `<RoadmapFooter />` inside `RoadmapBody`.

No DB migrations, no new dependencies (reuses `jspdf`, `jspdf-autotable`, `sonner`, Radix Collapsible).
