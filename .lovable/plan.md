# Analyze Tab — Save/Export footer + persistence fix

Three small, surgical changes. No redesign, existing styles only.

---

## 1. Move "Save / Export" block to the very bottom

Currently the Save to library / Export as PDF row sits inside `ResultsView.tsx` directly under the recommendations — which means it appears *above* the new Market Context panel. Move it so it acts as the true footer for the entire analysis (results + market context).

- Remove the Save/Export footer block from `src/components/insightflow/ResultsView.tsx` (the `mt-5 flex ... border-t` section near the bottom).
- Create a new tiny component `src/components/insightflow/AnalysisFooter.tsx` containing:
  - The "Analysis complete — {productName} · {date}" caption
  - "Save to library" button (keeps existing toast stub for now)
  - "Export as PDF" button (keeps existing toast stub for now)
  - A new **"Back to top"** affordance: a subtle pill-style button with an up-arrow icon (`ArrowUp` from lucide-react) that smooth-scrolls the page to `#results-anchor` (or `window.scrollTo({ top: 0, behavior: "smooth" })`).
- Mount it in `src/routes/index.tsx` *after* `<MarketContextPanel />` so the order becomes: Results → Market Context → Footer (Save / Export / Back-to-top).
- Styling: reuse the existing `SecondaryButton` look (border, surface hover) so it matches the rest of the page exactly. The back-to-top button uses the same secondary style with just the icon + "Back to top" text.

### Save-to-library behavior
The Library tab is still a "coming soon" stub (see `TabBar.tsx`). For now, keep "Save to library" as a toast confirmation ("Saved — view in Library when it ships"). Wiring real persistence belongs to the upcoming Library/Roadmap work; this prompt only repositions the controls and adds the back-to-top arrow.

---

## 2. Add a floating back-to-top arrow once results exist

In addition to the inline "Back to top" button in the footer, add a small floating circular button that appears in the bottom-right corner once `result` is set, so the user doesn't have to scroll all the way down to find it.

- Lives in `src/routes/index.tsx`, conditionally rendered when `result` is truthy.
- Fixed position (`fixed bottom-6 right-6`), small rounded-full button, primary background, `ArrowUp` icon, soft shadow, fades in.
- On click → smooth-scrolls to top so the user can switch to the Roadmap tab in `TabBar`.

---

## 3. Stop the page from clearing itself

**Root cause:** all analyze-tab state (`productName`, `result`, `pastedFeedback`, etc.) lives in the `AnalyzePage` component's `useState`. Any time the component unmounts and remounts — Vite HMR during dev, route transitions, or React StrictMode double-mounts — every value resets. The user perceives this as "the page clears itself after some time."

**Fix:** lift the analyze-tab state into a module-level store so it survives remounts but is naturally lost on a real page reload (which is exactly what the user asked for).

Implementation:
- Create `src/components/insightflow/analyzeStore.ts` exporting a tiny `useSyncExternalStore`-backed store (or a Zustand-style minimal store — no new dep needed; ~30 lines of plain TS) holding: `productName`, `businessGoal`, `mode`, `pastedFeedback`, `uploadedFile`, `researchQuery`, `result`.
- Refactor `src/routes/index.tsx` to read/write through that store instead of local `useState`. The `loading` flag stays local (it's transient).
- Because the store is a module singleton, values persist across:
  - HMR component swaps
  - Tab switches inside the SPA (Analyze ↔ Roadmap ↔ Library when those land)
  - StrictMode double-renders
- Values are cleared when:
  - The user does a hard refresh (module is re-evaluated → fresh empty store)
  - The user navigates away from the site (tab close)

This matches the requested behavior exactly: state survives normal in-app movement, only a refresh wipes it.

> Note: we deliberately do **not** use `localStorage`/`sessionStorage`. `sessionStorage` would also survive a refresh, which the user explicitly does not want. A module singleton is the correct tool here.

---

## Files touched

- `src/components/insightflow/ResultsView.tsx` — remove the trailing Save/Export footer block.
- `src/components/insightflow/AnalysisFooter.tsx` — **new**, holds Save / Export / Back-to-top.
- `src/components/insightflow/analyzeStore.ts` — **new**, module-level store + `useAnalyzeStore` hook.
- `src/routes/index.tsx` — swap local `useState` for store hook, mount `<AnalysisFooter />` after `<MarketContextPanel />`, add floating back-to-top button when `result` exists.

No backend, schema, or styling-system changes. No new npm packages.
