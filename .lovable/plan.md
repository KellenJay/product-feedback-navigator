## Scope

Three connected additions to InsightFlow. Nothing in Analyze, Roadmap, Library, landing, or auth changes. Existing `onboarding_state` on `profiles` (survey + 3-item checklist) and the current `OnboardingSurveyDialog` / `OnboardingChecklist` will be replaced by the new spec.

Build order (sequential, confirm each before next):
1. Profile (Part A)
2. Companies (Part B + switcher)
3. 5-step onboarding flow + confirmation
4. 6-item checklist launcher

## Feature 1 — Personal profile

New route `/account` profile section (or extend existing `account.tsx`):
- Circular photo upload → `avatars` bucket at `{user_id}/avatar.{ext}`; initials fallback from first+last name.
- Fields: first_name, last_name, email (read-only from auth), role (dropdown, pre-filled from onboarding Q1).
- Save → updates `profiles` row.

Schema additions to `profiles` (already has first_name, last_name, avatar_url, display_name):
- add `role text` column.

Marks checklist `profile_completed = true` on save.

## Feature 2 — Companies

New table `companies` per spec. Single `is_active` per user enforced by a partial unique index + transactional update on switch.

UI:
- `My Companies` section on `/account` below personal profile.
- Add/Edit dialog: name (req), description (textarea ≤500), industry (dropdown — SaaS / E-commerce / Consumer App / Marketplace / Agency / Media & Content / Healthcare / Fintech / EdTech / Other), website_url (optional, URL-validated), stage (Pre-idea / Validating / Pre-launch / Launched / Scaling).
- Company cards: name, industry, stage, description preview, Edit / Delete.
- Active-company switcher dropdown in top nav (next to InsightFlow logo in `TabBar.tsx`).

Cross-feature wiring (lightweight, no Analyze/Roadmap/Library logic changes):
- Switching active company sets `companies.is_active`; a small `activeCompanyStore` exposes it.
- Analyze tab product-name input reads `activeCompany?.name` as default value only if the field is empty (passive prefill — does NOT alter Analyze behavior).
- Library filter: add a single client-side filter chip "Current company" that filters by `entry.productName === activeCompany.name`. No schema change to library entries.

Marks checklist `company_added = true` after first save.

## Feature 3 — 5-step onboarding flow

Replaces current `OnboardingSurveyDialog`. Full-screen route `/onboarding` (gated: redirects to `/app` if `profiles.onboarding_state.flow.completed`). After signup, root redirects new users to `/onboarding` instead of `/app`.

- Progress bar "Step X of 5" at top.
- One question per screen, card-style options (single select), Back/Next nav.
- Screens 1–4: role / stage / process / primary_goal — exact copy from prompt.
- Screen 5: text input for first product name.
- Confirmation screen: "You're all set, {first_name}." + "We've set up your workspace for {product_name}." CTA → `/app?prefill={product_name}`.

Persistence: `profiles.onboarding_state.flow = { role, stage, process, primary_goal, first_product, completed: true }`. Role also writes to new `profiles.role` column. First product auto-creates a `companies` row (marked is_active) so the flow naturally feeds Feature 2.

Analyze tab reads `?prefill=` query param once and seeds the product-name input.

## Feature 4 — In-app checklist launcher

Replaces current `OnboardingChecklist`. Bottom-right floating launcher button showing "{done}/6"; click to expand panel.

Items (in order, matching new `onboarding_checklist` table):
1. Create your account — auto true on signup
2. Complete your profile — on profile save
3. Add your first company — on first company insert
4. Run your first analysis — on first successful analysis (hook into `analyzeStore` as today)
5. Generate your first roadmap — on first roadmap generation (hook into `roadmapStore`)
6. Save a project to your library — on first `libraryStore` entry with `saved: true`

Completed state UI: all 6 → replace body with "You've completed the InsightFlow basics. You know how to go from raw feedback to a team-ready roadmap." + Dismiss / Share buttons (Share copies `window.location.origin` to clipboard).

Dark theme, matches existing tokens. Hidden on `/login`, `/`, `/onboarding`, `/auth/*`.

## Database

One migration:

```sql
-- profiles: add role
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text;

-- companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  industry text,
  website_url text,
  stage text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_all_own ON public.companies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX companies_one_active_per_user
  ON public.companies(user_id) WHERE is_active;
CREATE TRIGGER companies_set_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- onboarding_checklist
CREATE TABLE public.onboarding_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  account_created boolean NOT NULL DEFAULT true,
  profile_completed boolean NOT NULL DEFAULT false,
  company_added boolean NOT NULL DEFAULT false,
  first_analysis boolean NOT NULL DEFAULT false,
  first_roadmap boolean NOT NULL DEFAULT false,
  first_library_save boolean NOT NULL DEFAULT false,
  dismissed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_checklist TO authenticated;
GRANT ALL ON public.onboarding_checklist TO service_role;
ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY checklist_all_own ON public.onboarding_checklist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- auto-create checklist row + profile role on signup (extend handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.onboarding_checklist (user_id) VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END; $$;
```

Existing `onboarding_state` jsonb column on `profiles` is kept and reused to store the 5-step flow answers (`flow.*`). The previous 3-item `checklist` subkey is abandoned in favor of the new table.

## Files

New:
- `src/routes/onboarding.tsx` — 5-step flow + confirmation
- `src/components/profile/PersonalProfileCard.tsx`
- `src/components/profile/CompanySection.tsx`
- `src/components/profile/CompanyDialog.tsx`
- `src/components/profile/CompanySwitcher.tsx` (mounted in `TabBar.tsx`)
- `src/components/profile/companyStore.ts` (active company + list, syncs Supabase)
- `src/components/onboarding/checklistStore.ts` (new 6-item store, replaces old)
- `src/components/onboarding/ChecklistLauncher.tsx` (replaces `OnboardingChecklist.tsx`)

Edited:
- `src/routes/account.tsx` — mount profile + companies sections
- `src/routes/app.tsx` — read `?prefill=` and active company for product-name default
- `src/routes/library.tsx` — add "Current company" filter chip
- `src/components/insightflow/TabBar.tsx` — mount `<CompanySwitcher />`
- `src/routes/__root.tsx` — swap old dialog/checklist for launcher; route new signups to `/onboarding`
- `src/integrations/supabase/types.ts` — regenerated by migration

Deleted (after build verification):
- `src/components/onboarding/OnboardingSurveyDialog.tsx`
- `src/components/onboarding/OnboardingChecklist.tsx`
- `src/components/onboarding/onboardingStore.ts` (replaced)

## Out of scope

- No changes to Analyze, Roadmap, Library internals beyond the two passive hooks above (product-name prefill, library company filter chip).
- No paywall.
- No association of historical library entries to companies (filter is name-based only).
