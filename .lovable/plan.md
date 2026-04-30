# Fixes for Analyze tab

## 1. Make document upload actually work

**Problem:** When you select a PDF or DOCX file, the app shows a toast saying "PDF/DOCX parsing coming in next build" and silently does nothing. Only `.txt` and `.csv` are read. That's why your upload doesn't go through.

**Fix:** Add real in-browser parsing for the file types we advertise.

- Add two small client-side libraries:
  - `pdfjs-dist` — extracts text from PDFs in the browser
  - `mammoth` — extracts text from `.docx`
- Rewrite `readFile` in `src/components/insightflow/InputPanel.tsx`:
  - `.txt` / `.csv` → keep current text reader
  - `.pdf` → use `pdfjs-dist` to read all pages and concatenate text
  - `.docx` → use `mammoth.extractRawText`
  - `.doc` (legacy binary Word) → not supported in-browser; show a clear toast asking the user to save as `.docx` or `.pdf`
  - Show a "Reading file…" loading state on the dropzone while parsing, and a friendly error if parsing fails or the document has no extractable text (e.g. a scanned PDF)
- After parsing, store the extracted text in `uploadedFile.content` exactly as today, so the existing analyze flow works unchanged.
- Cap extracted text at ~200k chars on the client to avoid sending oversized payloads (the edge function already truncates to 50k, so nothing downstream changes).

## 2. Rename priority levels P0/P1/P2 → P1/P2/P3

You want priorities to start at P1, not P0.

- `src/components/insightflow/types.ts`: change `priority: "P0" | "P1" | "P2"` → `priority: "P1" | "P2" | "P3"`.
- `src/components/insightflow/ResultsView.tsx`:
  - Update `PriorityTag` to accept `P1 | P2 | P3` with the same color mapping (P1 = red/critical, P2 = amber/high, P3 = muted/medium).
  - Update the info-icon tooltip above the first pain point to read:
    - **P1 — Critical.** Blocks core use or causes churn. Fix this sprint.
    - **P2 — High.** Significant friction for many users. Next 1–2 sprints.
    - **P3 — Medium.** Quality-of-life improvement. Backlog candidate.
  - Update the tooltip's `aria-label` to "What do P1, P2, P3 mean?".
- `supabase/functions/analyze-feedback/index.ts`:
  - Update the system prompt's "Priority guidance" section to use P1/P2/P3 with the same definitions.
  - Update the tool schema enum from `["P0","P1","P2"]` to `["P1","P2","P3"]` so the AI returns the new labels.

## Out of scope (intentionally not changing)

- No backend/database changes — there's no stored data using the old labels yet.
- No design/theme changes.
- No changes to other tabs.
