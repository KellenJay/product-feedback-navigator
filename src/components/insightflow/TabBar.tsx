import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "analyze" | "roadmap" | "library";

export function TabBar({ active }: { active: Tab }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
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

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-[780px] items-center justify-between px-6">
        <div className="flex items-center gap-7">
          <Link
            to="/"
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
        {email && (
          <div className="flex items-center gap-2 pb-2">
            <span className="hidden text-xs text-foreground-muted sm:inline">
              {email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 rounded p-1 text-foreground-muted hover:bg-surface hover:text-foreground"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
