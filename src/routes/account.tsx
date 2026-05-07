import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { requireAuth } from "@/lib/authGuard";
import { TabBar } from "@/components/insightflow/TabBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  beforeLoad: requireAuth,
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session) return;
      const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
      setEmail(session.user.email ?? null);
      setAvatarUrl(((meta.avatar_url as string | undefined) || (meta.picture as string | undefined)) ?? null);
      const metaName = (meta.full_name as string | undefined) || (meta.name as string | undefined) || null;
      setProvider(session.user.app_metadata?.provider ?? null);
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .maybeSingle();
        setName(profile?.display_name ?? metaName ?? null);
      } catch {
        setName(metaName);
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  const initials = (name || email || "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <div className="min-h-screen bg-background">
      <TabBar active="analyze" />
      <main className="mx-auto max-w-[780px] px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground">Account</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Your profile and sign-in details.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name ?? email ?? ""} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-base font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              {name && <div className="truncate text-lg font-medium text-foreground">{name}</div>}
              <div className="truncate text-sm text-foreground-muted">{email}</div>
              {provider && (
                <div className="mt-1 text-xs text-foreground-muted">
                  Signed in with {provider === "google" ? "Google" : provider}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
