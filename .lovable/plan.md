## Hero copy-only update

Copy-only swap in the hero section of `src/routes/index.tsx`. No design, layout, color, font, spacing, or component changes. Element count stays the same: one `<h1>` and one `<p>` under the eyebrow.

### Edits in `src/routes/index.tsx` (hero `<section>` only)

**1. `<h1>`** — keep the element, all classes, and the inline `style` exactly as-is. Replace inner content with a single string (drop the inner `<br />` and the `<span className="text-gradient-brand">` wrapper since the new headline has no second line and no gradient phrase):
```
Stop drowning in feedback. Start shipping what matters.
```

**2. `<p>`** — keep the element and all classes (`relative mx-auto mt-5 max-w-[620px] text-[15px] leading-7 text-foreground-muted`) exactly as-is. Replace inner text with the subheadline followed by the body, em-dashes preserved exactly:
```
InsightFlow turns scattered user signals into decisions you can defend. Paste in reviews, upload a research doc, or let InsightFlow search the web for you. In seconds, you get a structured breakdown of your biggest user pain points — scored by frequency, severity, and business impact — plus market context to back it up. The kind of output that makes stakeholders stop questioning and start building.
```

### Not touched
- Eyebrow pill ("AI feedback intelligence")
- `hero-beam` / `hero-grid` backgrounds
- Tailwind classes, fonts, spacing, colors
- `head()` metadata
- Every other section, component, and file

### Files touched
- `src/routes/index.tsx` — two text replacements inside the hero `<section>`.
