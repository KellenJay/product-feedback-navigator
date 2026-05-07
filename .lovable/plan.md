
## Why this is happening

Your auth logs show Google is actually issuing tokens every time you click — the backend is fine. The problem is on the client: after Google redirects back, the session sometimes doesn't get picked up before the `/login` page's guard checks for it, so you stay stuck on `/login?redirect=%2F`.

Note: OAuth in the Preview environment is also known to be flakier than the published site. Worth a quick test on the published URL too — but the changes below make the flow robust either way.

## Plan

### 1. New route: `/auth/callback`

Create `src/routes/auth.callback.tsx`. This is where Google will redirect back to.

Behavior:
- Public route (no `requireAuth`), shows a small "Signing you in…" spinner.
- On mount, subscribe to `supabase.auth.onAuthStateChange`.
- Also call `supabase.auth.getSession()` immediately in case the session is already hydrated.
- As soon as a session exists, read the `redirect` search param (default `/`) and `navigate({ to: redirect, replace: true })`.
- If no session arrives within ~5s, show an error + a "Back to sign in" link.

### 2. Update `handleGoogle` in `src/routes/login.tsx`

Change the `redirect_uri` to point at the new callback route, and pass the original target through as a query param so we can return the user there:

```
redirect_uri: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(target)}`
```

### 3. Harden the `/login` guard against the same race

In `src/routes/login.tsx`, add an `onAuthStateChange` listener inside `LoginPage` that navigates to `target` the moment a session appears. This way, even if a user lands back on `/login` with a session that's still hydrating, they get bounced automatically instead of getting stuck.

### 4. No changes to

- Supabase / Google OAuth configuration (not needed — tokens are issuing fine).
- `src/integrations/lovable/index.ts` (auto-generated, don't touch).
- `requireAuth` or any protected route.
- Any UI copy on the login page.

## Technical notes

- The callback page must be public (no `beforeLoad: requireAuth`) — otherwise the guard would bounce the user to `/login` before the session lands, recreating the exact bug.
- Use `replace: true` on the post-callback navigation so the back button doesn't return to `/auth/callback`.
- Always unsubscribe from `onAuthStateChange` on unmount to avoid leaks.
- File name uses TanStack's flat dot convention: `auth.callback.tsx` → `/auth/callback`.

## Out of scope

- Changing email/password flow.
- Touching the Supabase client or the Lovable auth wrapper.
- Any visual redesign of the login page.
