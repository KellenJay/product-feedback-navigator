import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Toaster, toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: search.redirect ?? "/" });
    }
  },
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — InsightFlow" },
      { name: "description", content: "Sign in to InsightFlow." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const target = search.redirect ?? "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: target });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your email", {
          description: "Click the verification link to finish signing up.",
        });
        setMode("signin");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent", { description: "Check your email." });
        setMode("signin");
      }
    } catch (err) {
      toast.error(
        mode === "signin" ? "Sign in failed" : mode === "signup" ? "Sign up failed" : "Couldn't send link",
        { description: err instanceof Error ? err.message : "Unknown error" },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + target,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: target });
    } catch (err) {
      toast.error("Google sign-in failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password";
  const cta =
    mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link";

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[780px] items-center justify-between px-6 py-4">
          <Link to="/" className="text-base font-semibold text-foreground">
            InsightFlow
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[400px] px-6 pt-20">
        <div className="text-center">
          <h1
            className="font-display text-foreground"
            style={{ fontSize: "clamp(28px, 4vw, 36px)", lineHeight: 1.1 }}
          >
            {title}
          </h1>
          <p className="mt-3 text-sm text-foreground-muted">
            {mode === "signin"
              ? "Sign in to access your library and roadmaps."
              : mode === "signup"
                ? "Save your analyses across devices."
                : "Enter your email and we'll send a reset link."}
          </p>
        </div>

        {mode !== "forgot" && (
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        )}

        {mode !== "forgot" && (
          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-foreground-muted">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <label className="text-xs font-medium text-foreground-muted">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {cta}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-foreground-muted">
          {mode === "signin" ? (
            <>
              <button type="button" onClick={() => setMode("forgot")} className="hover:text-foreground">
                Forgot password?
              </button>
              <button type="button" onClick={() => setMode("signup")} className="hover:text-foreground">
                Create account
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="mx-auto hover:text-foreground"
            >
              Back to sign in
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
