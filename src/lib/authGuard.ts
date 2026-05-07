import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Use inside a route's `beforeLoad` to require an authenticated user.
 * Redirects to /login with `redirect` search param so we can return after login.
 */
export async function requireAuth({ location }: { location: { href: string } }) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }
  return { userId: data.session.user.id, email: data.session.user.email };
}
