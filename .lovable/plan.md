## Landing page copy refresh

Update `src/routes/index.tsx` to reflect the new two-mode product (User Feedback + Idea Validation) and the prioritization angle (deciding whether to fix bugs, ship upgrades, or build new features). No layout or component changes — copy only.

### Sections to update

**1. Meta tags (title, description, og)**
- Broaden from "customer feedback into roadmaps" to cover both validating existing feedback and pressure-testing new ideas, ending with the prioritization promise.

**2. Hero**
- Eyebrow: keep "AI-powered product intelligence"
- Headline: keep "Stop guessing what to build next." / "Start deciding with evidence."
- Subhead: rewrite to mention both modes and the bug/upgrade/feature decision, e.g. "Analyze real user feedback or pressure-test a new idea — InsightFlow tells you what to prioritize next: the bug to fix, the upgrade to ship, or the feature to build."
- Hero mock caption: keep as-is (it already shows a feedback analysis, which is the default tab).

**3. Trust bar**
- Add "Indie hackers" or "Solo builders" to the pill list so the idea-validation audience is represented.

**4. Problem / Solution**
- Problem heading: broaden so it covers both "your customers are telling you" and "the market is telling you" — e.g. "Your users and the market keep telling you what to build. You just can't hear them."
- Problem body: add one line about idea validation (e.g. building from a hunch instead of evidence from the problem space).
- Solution feature list (4 cards): rewrite to:
  1. "Analyze user feedback at scale" — existing copy, lightly tightened.
  2. "Validate new ideas before you build" — new card replacing or sitting alongside one of the existing four. Mentions surfacing real pain points from public signal.
  3. "Validate with market context" — keep.
  4. "Prioritize bugs, upgrades, and new features" — replace the roadmap card text so it explicitly names the three buckets. Roadmap output stays mentioned at the end.
- Keep "Export team-ready PRDs" — combine into the prioritize card or keep as a fifth (prefer 4 cards total for layout).

Final 4 cards: Analyze user feedback · Validate new ideas · Cross-check with market context · Prioritize bugs, upgrades & features (with roadmap + PRD output).

**5. How it works (3 steps)**
- Step 01 title: "Feed it feedback — or an idea" — body covers both pasting reviews/docs/web research AND describing an unbuilt idea with its target audience.
- Step 02: keep "Get instant intelligence" — broaden body to mention "pain points worth solving" so it applies to both modes.
- Step 03: retitle "Prioritize and ship" — body names bugs/upgrades/features explicitly and ends with roadmap + PRD export.

**6. Feature highlights (3 long rows)**
- Row 1 tag "Feedback analysis": keep, tweak body to mention "for an existing product or a new idea."
- Row 2 tag "Market context": keep mostly as-is.
- Row 3 tag "Roadmap & PRD": retag to "Prioritization & roadmap" and rewrite headline to "Decide what to fix, upgrade, or build — then ship it." Body explains the three buckets and that the output is a roadmap + PRD.

**7. Who it's for**
- Update the four audience cards to include idea-stage builders. Suggested set:
  - Startup founders — mention validating before building.
  - Product managers — keep (feedback-driven prioritization).
  - Indie hackers & solo builders — new: pressure-test ideas with public signal before writing code.
  - SMB owners — keep (decide what to fix vs improve based on real customer voice).
- Drop "Growth & marketing teams" to make room, or keep as a 5th if grid allows. Recommend dropping to keep the 2×2 grid clean.

**8. Closing CTA**
- Headline: broaden — "Your next great product decision / is already in your users' voice — or the market's." (keep gradient on the second line).
- Sub: "InsightFlow finds it, scores it, and tells you whether to fix, upgrade, or build."

**9. Footer**
- Tagline: "Turn feedback and ideas into decisions."
- Right-column blurb: align with new meta description.

### Out of scope

- No new components, routes, or assets.
- No changes to hero mock content or feature mock visuals.
- No changes to InputPanel, IntentTabs, or edge function logic (already done).
