## Goal

Turn `/account` into a real preferences page (editable avatar, first name, last name, username) and remove the redundant "My Data" entry from the avatar dropdown.

## Changes

### 1. `TabBar.tsx` — dropdown cleanup
- Remove the "My Data" `DropdownMenuItem` and the now-unused `Database` icon import.
- Keep: header (avatar + name + email), Account settings, Sign out.

### 2. Database — extend `profiles` + add avatars storage
Migration:
- `ALTER TABLE public.profiles ADD COLUMN first_name text, ADD COLUMN last_name text, ADD COLUMN avatar_url text;`
- Create public storage bucket `avatars` with RLS:
  - Public SELECT.
  - Authenticated users can INSERT/UPDATE/DELETE only objects whose first path segment equals their `auth.uid()` (files stored as `{user_id}/avatar.{ext}`).

### 3. `/account` page rewrite — `src/routes/account.tsx`
Layout modeled on the uploaded screenshot: "Preferences" heading + subtitle, then a "Profile information" card with rows.

Card rows:
- **Avatar** (top, clickable) — shows current avatar or initials. Clicking opens a hidden file input; on select, upload to `avatars/{user_id}/avatar-{timestamp}.{ext}`, get public URL, save to `profiles.avatar_url`, and also call `supabase.auth.updateUser({ data: { avatar_url } })` so the dropdown stays in sync. Show a small "Change photo" hint and a "Remove" link when an avatar exists. Image-only, ≤2MB, validated client-side.
- **First name** — text input, bound to `profiles.first_name`.
- **Last name** — text input, bound to `profiles.last_name`.
- **Primary email** — read-only display of `auth.user.email` with helper text "Used for account notifications". No edit (out of scope; would require Supabase email-change flow).
- **Username** — text input, bound to `profiles.display_name` with helper text "Display name used across dashboard". Trimmed, 2–32 chars, validated with zod.

Footer of card:
- **Save** button (right-aligned, disabled until dirty, shows loading state). On submit: upsert into `profiles` for the current user, toast success, refresh local state. Avatar uploads save immediately on file pick (separate from the Save button) so users get instant feedback.

Below the card:
- Small "Account" section with "Signed in with {provider}" line and the existing **Sign out** button.

Data flow:
- On mount: `getSession()` → fetch `profiles` row for `user_id`, prefill form. Fall back to Google `user_metadata` (`given_name`, `family_name`, `name`, `avatar_url`) when profile fields are empty.
- After save: re-read the profile so `TabBar` (which already listens to its own session/profile) reflects changes on next mount; also broadcast via `supabase.auth.refreshSession()` to nudge the auth listener.

### 4. Out of scope (not doing)
- Changing the primary email (needs Supabase email-change verification flow).
- Password change (user signs in with Google).
- Deleting the account.

## Technical notes

- Avatar upload uses the browser supabase client; RLS on `storage.objects` enforces per-user folder isolation via `(storage.foldername(name))[1] = auth.uid()::text`.
- `profiles` already has `profiles_update_own` / `profiles_insert_own` policies, so the new columns are covered automatically.
- All form validation client-side with zod; trim inputs; toast on error.
- Use existing shadcn `Input`, `Button`, `Avatar`, `Label`, `Separator`.
