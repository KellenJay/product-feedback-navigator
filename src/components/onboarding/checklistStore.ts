import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChecklistKey =
  | "account_created"
  | "profile_completed"
  | "company_added"
  | "first_analysis"
  | "first_roadmap"
  | "first_library_save";

export interface ChecklistRow {
  account_created: boolean;
  profile_completed: boolean;
  company_added: boolean;
  first_analysis: boolean;
  first_roadmap: boolean;
  first_library_save: boolean;
  dismissed: boolean;
}

interface State {
  loaded: boolean;
  userId: string | null;
  row: ChecklistRow;
  open: boolean;
}

const empty: ChecklistRow = {
  account_created: true,
  profile_completed: false,
  company_added: false,
  first_analysis: false,
  first_roadmap: false,
  first_library_save: false,
  dismissed: false,
};

let state: State = { loaded: false, userId: null, row: empty, open: false };
const listeners = new Set<() => void>();
const emit = () => { for (const l of listeners) l(); };

export const checklistStore = {
  get: () => state,
  clear() {
    state = { loaded: false, userId: null, row: empty, open: false };
    emit();
  },
  async hydrateForUser(userId: string) {
    state = { ...state, userId };
    emit();
    const { data } = await supabase
      .from("onboarding_checklist")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) {
      // Row may not exist for users created before trigger; insert one
      await supabase.from("onboarding_checklist").insert({ user_id: userId, account_created: true });
      state = { ...state, loaded: true, row: empty };
    } else {
      state = { ...state, loaded: true, row: { ...empty, ...data } };
    }
    emit();
  },
  async mark(key: ChecklistKey) {
    if (!state.userId || state.row[key]) return;
    state = { ...state, row: { ...state.row, [key]: true } };
    emit();
    await supabase.from("onboarding_checklist").update({ [key]: true }).eq("user_id", state.userId);
  },
  async dismiss() {
    if (!state.userId) return;
    state = { ...state, row: { ...state.row, dismissed: true }, open: false };
    emit();
    await supabase.from("onboarding_checklist").update({ dismissed: true }).eq("user_id", state.userId);
  },
  toggleOpen() {
    state = { ...state, open: !state.open };
    emit();
  },
};

export function useChecklist(): State & { doneCount: number; total: number; allDone: boolean } {
  const s = useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => state,
    () => state,
  );
  const keys: ChecklistKey[] = [
    "account_created",
    "profile_completed",
    "company_added",
    "first_analysis",
    "first_roadmap",
    "first_library_save",
  ];
  const doneCount = keys.filter((k) => s.row[k]).length;
  return { ...s, doneCount, total: keys.length, allDone: doneCount === keys.length };
}
