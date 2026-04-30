## Goal
Re-skin the Analyze tab to match the Helixa reference: deep near-black background with a vertical electric-blue light beam behind the hero, monospace/techy display headings, blue primary CTA, and clean dark cards. Also remove the "Reddit · Capterra · G2 · CSV · PDF" trust row in the hero.

## Brand guidelines extracted from the reference
- Background: near-black `#05060A` with a vertical electric-blue radial spotlight behind the hero (`#1E5BFF` → transparent), softer ambient blue glow at page edges.
- Surfaces / cards: `#0E1320` with subtle `1px` border at `rgba(255,255,255,0.06)`, large `rounded-2xl` corners, soft inner shadow.
- Primary brand blue: `#2D6BFF` (hover `#1E5BFF`), used on CTA buttons and the "Most Popular" highlight.
- Text: primary `#F5F7FA`, muted `#8A93A6`, very-muted `#5B6478`.
- Accent micro-glows: blue at 20–30% opacity for halos under buttons and around the input card.
- Typography:
  - Display headline: monospace techy face — use **JetBrains Mono** (Google Font) at 600, sizes `clamp(40px, 6vw, 72px)`, line-height `1.05`, slight letter-spacing `-0.01em`.
  - Body: keep DM Sans, 15–16px, line-height 1.65, color muted.
  - Eyebrow chip + meta: uppercase, tracking-wider, 11px.
- CTA button: solid blue, white text, `rounded-xl`, `h-11`, soft blue glow shadow (`0 0 40px rgba(45,107,255,0.45)`).

## Changes

### 1. `src/styles.css`
- Replace the "GoDaddy after dark" dark palette with the Helixa-inspired palette:
  - `--background: #05060A`, `--surface/--card: #0E1320`, `--foreground: #F5F7FA`, `--foreground-muted: #8A93A6`.
  - `--primary: #2D6BFF`, `--primary-hover: #1E5BFF`, `--primary-foreground: #FFFFFF`.
  - `--accent: #2D6BFF` (drop the coral — reference uses a single blue accent).
  - `--border: rgba(255,255,255,0.06)`, `--ring: rgba(45,107,255,0.55)`.
- Add `--font-display: "JetBrains Mono", ui-monospace, monospace` to `@theme`.
- Replace `.hero-glow` blob animation with a **vertical light-beam** treatment:
  - `.hero-beam` — large vertical ellipse `radial-gradient(ellipse 40% 90% at 50% 0%, rgba(45,107,255,0.55), transparent 70%)`, plus a tighter inner beam.
  - Soft side-fade vignette so the beam reads as a column of light.
  - Keep `.hero-grid` dot pattern but lower opacity to ~6%.
- Update `.text-gradient-brand` to a blue-to-white gradient (no coral).
- Add `.btn-glow` utility for the soft blue halo under the primary CTA.
- Add Google Fonts import for JetBrains Mono in `src/routes/index.tsx` head links (alongside DM Sans).

### 2. `src/routes/index.tsx`
- Swap `.hero-glow` for the new `.hero-beam` element.
- Apply `font-display` (JetBrains Mono) class to the H1; tighten size/leading per spec.
- Update H1 copy styling to use the blue→white gradient on "prioritized roadmaps".
- **Remove the trust micro-row** ("Reddit · Capterra · G2 · CSV · PDF") entirely.
- Update the eyebrow chip styling (subtle blue dot, lighter border) to match reference.
- Add JetBrains Mono link tag in route head.

### 3. `src/components/insightflow/InputPanel.tsx`
- Update the primary "Analyze" button to use the new blue + glow shadow (`btn-glow`).
- Card now sits on the new `--surface` with a faint blue outer halo (matching the chat-card halo in the reference).

### 4. `src/components/insightflow/ResultsView.tsx`
- No structural change. Coral references (P0 badge color) get retuned to use `--destructive` (red) and `--warning` (amber) — accent coral is gone.
- Source links use blue (`--primary`) instead of coral.

## Out of scope
- No changes to Roadmap or Library tabs.
- No changes to the Edge Function or data model.
- No new sections (pricing, testimonials, FAQ from the reference) — only the hero/aesthetic is being adopted.

## Summary
Re-skin to a Helixa-style dark UI: black background, vertical blue light beam behind the hero, JetBrains Mono display headline, blue CTA with halo glow, single-accent blue palette (coral removed), and the trust row deleted from the hero.