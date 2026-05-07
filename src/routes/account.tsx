import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireAuth } from "@/lib/authGuard";
import { TabBar } from "@/components/insightflow/TabBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  beforeLoad: requireAuth,
  component: AccountPage,
});

const profileSchema = z.object({
  first_name: z.string().trim().max(50).optional().nullable(),
  last_name: z.string().trim().max(50).optional().nullable(),
  display_name: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(32, "Username must be 32 characters or fewer"),
});

function AccountPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [initial, setInitial] = useState({ firstName: "", lastName: "", username: "" });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) return;
      setUserId(session.user.id);
      setEmail(session.user.email ?? null);
      setProvider(session.user.app_metadata?.provider ?? null);

      const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
      const metaFirst = (meta.given_name as string | undefined) ?? null;
      const metaLast = (meta.family_name as string | undefined) ?? null;
      const metaName =
        (meta.full_name as string | undefined) || (meta.name as string | undefined) || null;
      const metaAvatar =
        (meta.avatar_url as string | undefined) || (meta.picture as string | undefined) || null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, display_name, avatar_url")
        .maybeSingle();

      const f = profile?.first_name ?? metaFirst ?? "";
      const l = profile?.last_name ?? metaLast ?? "";
      const u = profile?.display_name ?? metaName ?? (session.user.email?.split("@")[0] ?? "");
      const a = profile?.avatar_url ?? metaAvatar ?? null;

      setFirstName(f);
      setLastName(l);
      setUsername(u);
      setAvatarUrl(a);
      setInitial({ firstName: f, lastName: l, username: u });
      setLoading(false);
    })();
  }, []);

  const dirty =
    firstName !== initial.firstName ||
    lastName !== initial.lastName ||
    username !== initial.username;

  const initials =
    ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase() ||
    (username || email || "?")
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") ||
    "?";

  const handleSave = async () => {
    if (!userId) return;
    const parsed = profileSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      display_name: username,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            first_name: parsed.data.first_name || null,
            last_name: parsed.data.last_name || null,
            display_name: parsed.data.display_name,
          },
          { onConflict: "user_id" },
        );
      if (error) throw error;

      // Mirror to auth metadata so dropdown reflects change
      await supabase.auth.updateUser({
        data: {
          full_name: [parsed.data.first_name, parsed.data.last_name].filter(Boolean).join(" ") || parsed.data.display_name,
          name: parsed.data.display_name,
        },
      });

      setInitial({ firstName, lastName, username });
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2MB or smaller");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;

      const { error: profErr } = await supabase
        .from("profiles")
        .upsert(
          { user_id: userId, avatar_url: url, display_name: username || email?.split("@")[0] || "user" },
          { onConflict: "user_id" },
        );
      if (profErr) throw profErr;

      await supabase.auth.updateUser({ data: { avatar_url: url } });
      setAvatarUrl(url);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!userId) return;
    setUploading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { user_id: userId, avatar_url: null, display_name: username || email?.split("@")[0] || "user" },
          { onConflict: "user_id" },
        );
      if (error) throw error;
      await supabase.auth.updateUser({ data: { avatar_url: null } });
      setAvatarUrl(null);
      toast.success("Photo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <TabBar active="analyze" />
      <main className="mx-auto max-w-[780px] px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground">Preferences</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Manage your account profile, connections, and dashboard experience.
        </p>

        <h2 className="mt-10 text-base font-semibold text-foreground">Profile information</h2>

        <div className="mt-4 rounded-lg border border-border bg-surface">
          {/* Avatar row */}
          <div className="flex items-center justify-between gap-4 px-5 py-5 border-b border-border">
            <div>
              <Label className="text-sm font-medium">Profile photo</Label>
              <p className="mt-1 text-xs text-foreground-muted">
                PNG or JPG, up to 2MB.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {avatarUrl && !uploading && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs text-foreground-muted hover:text-foreground"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="group relative rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Change photo"
              >
                <Avatar className="h-14 w-14">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={username || email || ""} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Camera className="h-4 w-4 text-white" />
                  )}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </div>

          {/* First name */}
          <Row label="First name">
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              disabled={loading}
            />
          </Row>

          {/* Last name */}
          <Row label="Last name">
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              disabled={loading}
            />
          </Row>

          {/* Email (read-only) */}
          <Row label="Primary email" hint="Used for account notifications">
            <Input value={email ?? ""} readOnly disabled />
          </Row>

          {/* Username */}
          <Row label="Username" hint="Display name used across dashboard">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              disabled={loading}
            />
          </Row>

          <div className="flex justify-end px-5 py-4">
            <Button onClick={handleSave} disabled={!dirty || saving || loading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>

        <h2 className="mt-10 text-base font-semibold text-foreground">Account</h2>
        <div className="mt-4 rounded-lg border border-border bg-surface px-5 py-5">
          {provider && (
            <p className="text-sm text-foreground-muted">
              Signed in with {provider === "google" ? "Google" : provider}
            </p>
          )}
          <div className="mt-4">
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

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-3 border-b border-border px-5 py-4 sm:grid-cols-[1fr_320px]">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {hint && <p className="mt-1 text-xs text-foreground-muted">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}
