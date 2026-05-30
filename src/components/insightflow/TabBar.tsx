import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanySwitcher } from "@/components/profile/CompanySwitcher";

type Tab = "analyze" | "roadmap" | "library";

type AccountInfo = {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export function TabBar({ active }: { active: Tab }) {
  const navigate = useNavigate();
  const [info, setInfo] = useState<AccountInfo>({ email: null, name: null, avatarUrl: null });

  useEffect(() => {
    const apply = async (session: { user: { email?: string | null; user_metadata?: Record<string, unknown> } } | null) => {
      if (!session) {
        setInfo({ email: null, name: null, avatarUrl: null });
        return;
      }
      const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
      const email = session.user.email ?? null;
      const metaName =
        (meta.full_name as string | undefined) ||
        (meta.name as string | undefined) ||
        null;
      const avatarUrl = (meta.avatar_url as string | undefined) || (meta.picture as string | undefined) || null;

      // Try profile display_name override
      let displayName = metaName;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .maybeSingle();
        if (data?.display_name) displayName = data.display_name;
      } catch {
        // ignore
      }
      setInfo({
        email,
        name: displayName ?? (email ? email.split("@")[0] : null),
        avatarUrl,
      });
    };

    void supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      void apply(session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const baseTab =
    "relative px-1 pb-3 pt-1 text-sm transition-colors focus:outline-none";
  const inactive =
    "text-foreground-muted hover:text-foreground cursor-pointer";
  const activeCls = "text-foreground font-medium";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  const initials = (info.name || info.email || "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-[780px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="no-scrollbar -mx-1 flex items-center gap-3 overflow-x-auto px-1 sm:gap-5">
          <CompanySwitcher />
          <Link
            to="/app"
            className={`${baseTab} ${active === "analyze" ? activeCls : inactive}`}
          >
            Analyze
            {active === "analyze" && (
              <span className="absolute inset-x-0 -bottom-px h-[2px] bg-foreground" />
            )}
          </Link>
          <Link
            to="/roadmap"
            className={`${baseTab} ${active === "roadmap" ? activeCls : inactive}`}
          >
            Roadmap
            {active === "roadmap" && (
              <span className="absolute inset-x-0 -bottom-px h-[2px] bg-foreground" />
            )}
          </Link>
          <Link
            to="/library"
            className={`${baseTab} ${active === "library" ? activeCls : inactive}`}
          >
            Library
            {active === "library" && (
              <span className="absolute inset-x-0 -bottom-px h-[2px] bg-foreground" />
            )}
          </Link>
        </div>
        {info.email && (
          <div className="pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Account menu"
              >
                <Avatar className="h-8 w-8">
                  {info.avatarUrl && <AvatarImage src={info.avatarUrl} alt={info.name ?? info.email} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar className="h-9 w-9">
                    {info.avatarUrl && <AvatarImage src={info.avatarUrl} alt={info.name ?? info.email} />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    {info.name && (
                      <div className="truncate text-sm font-medium text-foreground">{info.name}</div>
                    )}
                    <div className="truncate text-xs text-foreground-muted">{info.email}</div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate({ to: "/account" })}>
                  <Settings className="mr-2 h-4 w-4" />
                  Account settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  );
}
