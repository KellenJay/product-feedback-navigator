# InsightFlow: Feedback to Roadmap

Here's your Lovable prompt, structured so you build page by page without overwhelming it:

Lovable Prompt — InsightFlow (Page 1 of 3: Landing Page / Analyze Tab)

You are building a web application called InsightFlow — an AI-powered product feedback intelligence tool for product managers. We are building this page by page. Today we are ONLY building Page 1: the Analyze tab (the main landing page). Do not build any other tabs or pages yet.

App Overview (for context only — do not build yet)

InsightFlow has 3 tabs:

Analyze ← build this today

Roadmap ← next session

Library ← session after that

Page 1: Analyze Tab — Full Specification

Layout: Clean, minimal, single-column centered layout. Max width 780px. White background. Subtle gray borders. Professional SaaS feel — think Linear, Notion, or Frill.co. No gradients. No heavy shadows. Generous white space.

Typography: Use a clean modern sans-serif (e.g. DM Sans, Plus Jakarta Sans, or Geist). Headings at font-weight 500-600, body at 400. Nothing bold-heavy.

Color palette:

Primary action: #1D9E75 (green — for primary CTA buttons)

Text primary: #1A1A1A

Text secondary: #6B7280

Background: #FFFFFF

Surface / card: #F9FAFB

Border: #E5E7EB

Accent tag / badge: #EFF6FF with #1D4ED8 text

Section 1 — Page Header

App name top-left: InsightFlow in 16px, font-weight 600, color #1A1A1A

Tagline below the title (centered, full width): "Turn raw customer feedback into prioritized roadmaps — in minutes." in 28px, weight 500

Subtext below tagline: "Paste reviews, upload a document, or let AI scrape the web. InsightFlow analyzes pain points, scores them by impact, and generates a structured summary ready for roadmapping." in 15px, color #6B7280

Section 2 — Input Panel (Card)

This is the main input area. It is a card with a subtle border and #F9FAFB background, border-radius 12px, padding 24px.

Row 1 — Two inputs side by side:

Left: text input labeled "Product name" — placeholder: "e.g. GoDaddy Managed WordPress"

Right: text input labeled "Business goal (optional)" — placeholder: "e.g. reduce churn, improve onboarding"

Row 2 — Feedback source selector: Label: "How would you like to provide feedback?" Three toggle options displayed as pill-style selector tabs (only one can be active at a time):

📋 Paste feedback (default active)

📄 Upload document

🔍 Deep research

Row 3 — Dynamic input area (changes based on toggle selection):

If "Paste feedback" is selected: Large textarea, 140px height, placeholder: "Paste user reviews, Reddit posts, Capterra reviews, support tickets, forum threads…"

If "Upload document" is selected: Drag-and-drop file upload zone. Accepts .txt, .pdf, .docx, .csv. Label: "Drag a file here or click to browse". Show file name once uploaded. Show a remove/clear button.

If "Deep research" is selected: Show a text field labeled "What should we research?" with placeholder: "e.g. GoDaddy Managed WordPress reviews on Reddit, G2, Capterra". Below it, a small note in gray: "InsightFlow will use AI to search the web and gather recent reviews and forum discussions about this product."

Row 4 — CTA button: Full-width button, #1D9E75 background, white text, border-radius 8px, height 48px, font-size 15px, font-weight 500. Label: "✦ Analyze feedback". When loading: show a spinner and label "Analyzing with Claude…". Disable the button while loading.

Section 3 — Results Area (appears below the input card after analysis)

This section is hidden until the user clicks Analyze. It then animates in (fade + slide up). It has four sub-sections rendered in order:

3a — Summary metrics row (4 cards, equal width): Each metric card has a gray label (12px) above a large value (22px, weight 500):

Reviews analyzed — number

Overall sentiment — word (Negative / Mixed / Positive) with color coding: red for Negative, amber for Mixed, green for Positive

Critical issues — number in red

Top pain area — category name

3b — Executive summary card: White card, border, border-radius 12px, padding 20px. Label "Executive summary" at 11px uppercase gray. Body text below at 14px, line-height 1.7.

3c — Prioritized issues list: Label "Prioritized pain points" at 11px uppercase gray. Below it, a list of issue cards. Each card:

Rank badge (circle, numbered, top 3 in green)

Issue title (15px, weight 500)

Impact score pill on the right (e.g. Impact 87) — green if ≥70, amber if 40-69

Category tag (blue pill), Priority tag (gray pill), Mentions count tag (gray pill)

Description in 13px gray below

1-2 user quotes in italic 12px gray, inside a subtle bordered box at the bottom of the card

3d — Top recommendations box: #F9FAFB surface, border-radius 12px, padding 20px. Label "Top recommendations" at 14px, weight 500. Below: 3 numbered items, each with a bold title and one-sentence detail.

Section 4 — Export / Save bar (appears below results)

A thin bar with:

Left: "Analysis complete — GoDaddy Managed WordPress · April 29, 2026"

Right: Two buttons: "Save to library" (outlined) and "Export as PDF" (outlined)

These buttons do not need to be fully functional yet — just render them and show a toast notification "Coming in next build" when clicked.

Tab Navigation (stub only — no content yet)

At the top of the page, show a horizontal tab bar with three tabs:

Analyze (active, underlined)

Roadmap (inactive, grayed out, clicking shows toast: "Coming soon — build next session")

Library (inactive, grayed out, same toast)

Technical stack:

React + Tailwind CSS

Claude API (claude-sonnet-4-20250514) for analysis — use fetch to POST to https://api.anthropic.com/v1/messages

File parsing: use browser FileReader API for .txt and .csv; for .pdf and .docx show a toast "PDF/DOCX parsing coming in next build" and extract what you can

Deep research mode: call Claude API with web search tool enabled

All state is local/in-memory for now — no backend or auth yet

No localStorage — store all state in React useState

Do NOT build yet:

Roadmap tab content

Library tab content

User authentication / login

Backend or database

Any other pages

Confirm before starting:

Before writing any code, please confirm you understand the scope: we are building only the Analyze tab today. Reply with a brief summary of what you will build, then proceed.

That prompt is ready to paste directly into Lovable. A few things to note before you do:

Why it's structured this way: Starting with the confirmation step forces Lovable to stay scoped — it has a tendency to hallucinate the full app if you don't explicitly constrain it. The "do not build yet" section is just as important as the spec itself.

When Lovable finishes Page 1, come back and I'll write the Page 2 prompt for the Roadmap tab — which is where the document-selection dropdown, roadmap generation, epic/user story output, and sprint planning all live. That one's more complex so it needs its own clean prompt.

For Page 3 (Library), we'll spec the project storage, filtering, and folder organization once the data model from Pages 1 and 2 is clear.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://product-feedback-navigator.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d5e05e6c-59ee-4e80-8292-6161dd6b6123).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
