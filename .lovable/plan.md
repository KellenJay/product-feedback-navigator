I’ll make the saved-library restore flow deterministic so opening a saved analysis shows stored work and only regenerates when the user explicitly clicks a regenerate/analyze-again button.

1. **Fix market context auto-regeneration**
   - Update `MarketContextPanel` so it does not automatically call the AI when a saved analysis is opened without stored market context.
   - If stored market context exists, render it immediately.
   - If no stored context exists, show an idle state with a manual action instead of starting a search.
   - Keep the existing “Analyze again” button as the only way to regenerate once context exists.

2. **Preserve saved PRDs across route changes**
   - Update the PRD flow so an already generated PRD is never overwritten or regenerated just because the user navigates between Analyze, Library, and Roadmap.
   - Only generate a PRD when there is no saved PRD for that opened analysis, or when the user explicitly retries/regenerates.
   - Ensure generated PRDs are attached back to the saved library/cloud record after completion.

3. **Stop stale local cache from replacing saved entry data**
   - Adjust save/open behavior so saving a library entry captures the correct market context/PRD for that entry, not unrelated local cache from another analysis.
   - When opening from Library, hydrate Analyze/Roadmap/PRD/Market Context from the selected entry first, then avoid background AI calls.

4. **Verification**
   - Confirm the only code paths invoking `market-context` and `generate-prd` are fresh analysis creation or explicit user actions.
   - Confirm “Open in Analyze” restores saved analysis output without showing a loading/re-analyzing state.