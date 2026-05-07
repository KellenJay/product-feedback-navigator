import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CallbackSearch {
  redirect?: string;
}

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>): CallbackSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const target = search.redirect ?? "/";
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      navigate({ to: target, replace: true });
    };

    // If session is already hydrated, go immediately.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });

    // Otherwise wait for it to land.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });

    const timeout = window.setTimeout(() => {
      if (!done) setErrored(true);
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate, target]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      {errored ? (
        <div className="text-center">
          <p className="text-sm text-foreground">Sign-in didn't complete.</p>
          <Link
            to="/login"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm text-foreground-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing you in…
        </div>
      )}
    </div>
  );
}
