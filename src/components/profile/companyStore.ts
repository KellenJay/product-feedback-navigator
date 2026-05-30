import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Company {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  industry: string | null;
  website_url: string | null;
  stage: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const INDUSTRIES = [
  "SaaS",
  "E-commerce",
  "Consumer App",
  "Marketplace",
  "Agency",
  "Media & Content",
  "Healthcare",
  "Fintech",
  "EdTech",
  "Other",
] as const;

export const STAGES = [
  "Pre-idea",
  "Validating",
  "Pre-launch",
  "Launched",
  "Scaling",
] as const;

interface State {
  loaded: boolean;
  userId: string | null;
  companies: Company[];
}

let state: State = { loaded: false, userId: null, companies: [] };
const listeners = new Set<() => void>();
const emit = () => { for (const l of listeners) l(); };

export const companyStore = {
  get: () => state,
  clear() {
    state = { loaded: false, userId: null, companies: [] };
    emit();
  },
  async hydrateForUser(userId: string) {
    state = { ...state, userId };
    emit();
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    state = { loaded: true, userId, companies: (data as Company[]) ?? [] };
    emit();
  },
  async create(input: Omit<Company, "id" | "user_id" | "is_active" | "created_at" | "updated_at"> & { setActive?: boolean }) {
    if (!state.userId) throw new Error("Not signed in");
    const setActive = input.setActive ?? state.companies.length === 0;
    if (setActive) {
      await supabase.from("companies").update({ is_active: false }).eq("user_id", state.userId).eq("is_active", true);
    }
    const { data, error } = await supabase
      .from("companies")
      .insert({
        user_id: state.userId,
        name: input.name,
        description: input.description,
        industry: input.industry,
        website_url: input.website_url,
        stage: input.stage,
        is_active: setActive,
      })
      .select()
      .single();
    if (error) throw error;
    state = { ...state, companies: [...state.companies, data as Company] };
    emit();
    return data as Company;
  },
  async update(id: string, patch: Partial<Omit<Company, "id" | "user_id" | "created_at" | "updated_at">>) {
    const { data, error } = await supabase
      .from("companies")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    state = {
      ...state,
      companies: state.companies.map((c) => (c.id === id ? (data as Company) : c)),
    };
    emit();
  },
  async remove(id: string) {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) throw error;
    state = { ...state, companies: state.companies.filter((c) => c.id !== id) };
    emit();
  },
  async setActive(id: string) {
    if (!state.userId) return;
    await supabase.from("companies").update({ is_active: false }).eq("user_id", state.userId).eq("is_active", true);
    const { error } = await supabase.from("companies").update({ is_active: true }).eq("id", id);
    if (error) throw error;
    state = {
      ...state,
      companies: state.companies.map((c) => ({ ...c, is_active: c.id === id })),
    };
    emit();
  },
};

export function useCompanies(): State & { active: Company | null } {
  const s = useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => state,
    () => state,
  );
  return { ...s, active: s.companies.find((c) => c.is_active) ?? null };
}
