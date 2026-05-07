## Replace email + logout icon with an account menu

Right now the top-right of every tab shows the raw email and a small logout icon. Replace that with a proper account button that opens a dropdown — the standard pattern users expect.

### What the new button looks like

A circular avatar button in the top-right corner of `TabBar`:
- If the user has a Google profile picture, show it.
- Otherwise show initials (from display name, or first letter of email) on a colored circle.

Clicking it opens a dropdown menu.

### What's inside the dropdown

```text
┌─────────────────────────────┐
│  [avatar] Display name      │
│           email@domain.com  │
├─────────────────────────────┤
│  ⚙  Account settings        │
│  🗄  My data                │
├─────────────────────────────┤
│  ↪  Sign out                │
└─────────────────────────────┘
```

- **Header**: avatar + name (from Google `full_name` / `name`, fall back to email prefix) + email.
- **Account settings** → navigates to a new `/account` route (simple page showing name, email, "signed in with Google", and a placeholder for future settings — keeps the menu link from being a dead end).
- **My data** → navigates to `/library` (that's where their saved analyses, folders, and roadmaps live — the in-app equivalent of "my database"). We are not exposing the raw Lovable Cloud dashboard, since that's not user-facing.
- **Sign out** → same `supabase.auth.signOut()` flow as today, then redirect to `/login`.

### Where the data comes from

- `supabase.auth.getSession()` already gives us `session.user.email` and `session.user.user_metadata` — Google populates `user_metadata.avatar_url`, `user_metadata.full_name`, and `user_metadata.name` on OAuth sign-in. No extra API calls or schema changes needed.
- The existing `profiles` table stores `display_name`. If a profile row exists, prefer `profiles.display_name` over Google's name. (Profile row is auto-created by the existing trigger.)

### Files

- **Edit** `src/components/insightflow/TabBar.tsx`: replace the email span + logout button with a `DropdownMenu` (shadcn) triggered by an `Avatar`. Read user metadata from session; optionally fetch `display_name` from `profiles` once on mount.
- **New** `src/routes/account.tsx`: minimal account page — avatar, name, email, "Connected with Google", and a Sign out button. Protected by `requireAuth`.
- **No changes** to auth, RLS, the login/callback flow, or any other tab.

### Out of scope

- Editing display name / uploading a custom avatar (the Account page is read-only for now; we can add editing later if you want).
- Exposing the Lovable Cloud admin dashboard inside the app.

After this lands, you'll be ready to publish.
