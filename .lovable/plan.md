# Add document uploads in two places

Two additive features. Nothing else in the app changes.

## 1. Knowledge documents on a company (Edit Company)

In the existing **Edit company** dialog (`CompanyDialog`), add a new **Knowledge documents** section under Stage. Users can upload up to **10 files per company** (PDF, DOCX, images, text, markdown — anything ≤ 20 MB each). Each row shows filename, size, uploaded date, a download link, and a delete (trash) button. The 11th upload is blocked with a toast.

Files are stored privately so only the owner can read them.

## 2. Supporting documents on a Feature/Bug/Upgrade request

In `FeatureIdeaPanel` (the "Have a feature in mind?" card on the Roadmap tab), add a **Supporting documents (optional)** uploader right below the Company URL field. Same allowed types and 20 MB limit; cap at 10 docs per request. Uploaded files are listed inline with remove buttons.

When "Generate roadmap" is clicked, the uploaded files are persisted and their filenames + download URLs are appended to the prompt sent to `analyze-feedback`, so the model has context like:

```text
Supporting documents the team provided:
- spec.pdf — https://…/spec.pdf
- before-after.png — https://…/before-after.png
```

Plain-text/markdown files also have their contents inlined (truncated at ~8 KB each) so the model can actually read them. PDFs/DOCX/images are referenced by URL only in v1 (no deep parsing).

## Technical notes

**Storage**
- Create one private bucket: `company-docs`. Path convention: `{user_id}/{company_id}/{uuid}-{filename}` for company files, `{user_id}/feature-ideas/{request_id}/{uuid}-{filename}` for feature-idea uploads. RLS on `storage.objects` restricts read/write/delete to `auth.uid()::text = (storage.foldername(name))[1]`.

**Database** (one migration)
- `public.company_documents` — `id, company_id, user_id, storage_path, file_name, mime_type, size_bytes, created_at`. RLS scoped to `auth.uid() = user_id`. Trigger/check to enforce ≤ 10 per `company_id` (enforced at app layer + a `BEFORE INSERT` trigger that raises if count ≥ 10).
- `public.feature_idea_documents` — `id, user_id, request_id (uuid), storage_path, file_name, mime_type, size_bytes, created_at`. Same RLS pattern. `request_id` is generated client-side per FeatureIdeaPanel session so uploads can be grouped and later linked to the resulting `analysis_session`.
- Both tables get standard GRANTs (`authenticated`, `service_role`).

**UI**
- New `DocumentUploader` component (`src/components/common/DocumentUploader.tsx`) used by both surfaces. Drag-and-drop + click-to-pick, list of attached files, per-row delete, max-count enforcement, mime/size validation, toast errors.
- `CompanyDialog` mounts it scoped to the company (loads existing docs on open, hides uploader until the company has been saved at least once so we have a `company_id`; new companies show a hint that docs can be added after first save).
- `FeatureIdeaPanel` mounts it scoped to a generated `request_id`; on successful generate, the `request_id` is stored on the new `analysis_sessions` row (no schema change there — reuse existing `feedback_source` or add a small `attached_docs` jsonb if needed; final choice during implementation, no user-visible impact).

**Prompt wiring**
- `buildResearchQuery` extended to optionally take a `docs: { name, url, inlineText? }[]` array and append a "Supporting documents" block when present. No change to the edge function itself.

## Out of scope
- OCR / PDF text extraction (URLs only for non-text formats in v1).
- Sharing docs across companies.
- Versioning or folders inside a company.
