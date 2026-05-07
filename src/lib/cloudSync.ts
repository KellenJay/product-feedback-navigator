import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult, MarketContext } from "@/components/insightflow/types";
import type { PRD } from "@/components/insightflow/prd";
import type { Overrides as RoadmapOverrides } from "@/components/insightflow/roadmapStore";
import type { LibraryEntry, LibraryFolder } from "@/components/insightflow/libraryStore";

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export interface SaveAnalysisInput {
  productName: string;
  businessGoal: string;
  mode: "paste" | "upload" | "deep-research";
  source: string;
  rawFeedback: string;
  result: AnalysisResult;
}

export async function saveAnalysis(
  input: SaveAnalysisInput,
): Promise<{ projectId: string; sessionId: string } | null> {
  try {
    const userId = await getUserId();
    if (!userId) return null;

    const feedbackSource =
      input.mode === "paste"
        ? "paste"
        : input.mode === "upload"
          ? "upload"
          : "research";

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        product_name: input.productName,
        business_goal: input.businessGoal,
      })
      .select("id")
      .single();
    if (projectError) throw projectError;

    const { data: session, error: sessionError } = await supabase
      .from("analysis_sessions")
      .insert({
        user_id: userId,
        project_id: project.id,
        product_name: input.productName,
        business_goal: input.businessGoal,
        raw_feedback: input.rawFeedback,
        feedback_source: feedbackSource,
        analysis_output: input.result as unknown as Record<string, unknown>,
        title: input.productName.trim() || "Untitled analysis",
      })
      .select("id")
      .single();
    if (sessionError) throw sessionError;

    return { projectId: project.id, sessionId: session.id };
  } catch (err) {
    console.error("[cloudSync.saveAnalysis] failed:", err);
    return null;
  }
}

export async function patchMarketContext(
  sessionId: string,
  context: MarketContext,
) {
  try {
    const { error } = await supabase
      .from("analysis_sessions")
      .update({ market_context_output: context as unknown as Record<string, unknown> })
      .eq("id", sessionId);
    if (error) throw error;
  } catch (err) {
    console.error("[cloudSync.patchMarketContext] failed:", err);
  }
}

export async function saveRoadmap(input: {
  sessionId: string | null;
  productName: string;
  prd: PRD | null;
  overrides: RoadmapOverrides;
}) {
  if (!input.sessionId) return;
  try {
    const userId = await getUserId();
    if (!userId) return;

    // Look up the session's project_id
    const { data: session } = await supabase
      .from("analysis_sessions")
      .select("project_id")
      .eq("id", input.sessionId)
      .maybeSingle();

    // Upsert by analysis_session_id
    const { data: existing } = await supabase
      .from("roadmaps")
      .select("id")
      .eq("analysis_session_id", input.sessionId)
      .maybeSingle();

    const payload = {
      user_id: userId,
      project_id: session?.project_id ?? null,
      analysis_session_id: input.sessionId,
      product_name: input.productName,
      prd_output: (input.prd as unknown as Record<string, unknown>) ?? null,
      roadmap_overrides: input.overrides as unknown as Record<string, unknown>,
    };

    if (existing?.id) {
      const { error } = await supabase
        .from("roadmaps")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("roadmaps").insert(payload);
      if (error) throw error;
    }
  } catch (err) {
    console.error("[cloudSync.saveRoadmap] failed:", err);
  }
}

export async function pinEntry(sessionId: string, folderId: string | null = null) {
  try {
    const { error } = await supabase
      .from("analysis_sessions")
      .update({ saved: true, folder_id: folderId })
      .eq("id", sessionId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[cloudSync.pinEntry] failed:", err);
    return false;
  }
}

export async function unpinEntry(sessionId: string) {
  try {
    const { error } = await supabase
      .from("analysis_sessions")
      .update({ saved: false, folder_id: null })
      .eq("id", sessionId);
    if (error) throw error;
  } catch (err) {
    console.error("[cloudSync.unpinEntry] failed:", err);
  }
}

export async function deleteEntry(sessionId: string) {
  try {
    const { error } = await supabase
      .from("analysis_sessions")
      .delete()
      .eq("id", sessionId);
    if (error) throw error;
  } catch (err) {
    console.error("[cloudSync.deleteEntry] failed:", err);
  }
}

export async function renameEntry(sessionId: string, title: string) {
  try {
    const { error } = await supabase
      .from("analysis_sessions")
      .update({ title })
      .eq("id", sessionId);
    if (error) throw error;
  } catch (err) {
    console.error("[cloudSync.renameEntry] failed:", err);
  }
}

export async function moveEntryToFolder(sessionId: string, folderId: string | null) {
  try {
    const { error } = await supabase
      .from("analysis_sessions")
      .update({ folder_id: folderId, saved: true })
      .eq("id", sessionId);
    if (error) throw error;
  } catch (err) {
    console.error("[cloudSync.moveEntryToFolder] failed:", err);
  }
}

export async function createFolder(name: string): Promise<LibraryFolder | null> {
  try {
    const userId = await getUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from("library_folders")
      .insert({ user_id: userId, name })
      .select("id, name, created_at")
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      createdAt: new Date(data.created_at).getTime(),
    };
  } catch (err) {
    console.error("[cloudSync.createFolder] failed:", err);
    return null;
  }
}

export async function deleteFolder(id: string) {
  try {
    const { error } = await supabase.from("library_folders").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("[cloudSync.deleteFolder] failed:", err);
  }
}

export async function renameFolder(id: string, name: string) {
  try {
    const { error } = await supabase
      .from("library_folders")
      .update({ name })
      .eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("[cloudSync.renameFolder] failed:", err);
  }
}

export interface LoadedLibrary {
  entries: LibraryEntry[];
  folders: LibraryFolder[];
}

export async function loadLibrary(): Promise<LoadedLibrary | null> {
  try {
    const userId = await getUserId();
    if (!userId) return null;

    const [{ data: sessions, error: sErr }, { data: folders, error: fErr }, { data: roadmaps }] =
      await Promise.all([
        supabase
          .from("analysis_sessions")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("library_folders")
          .select("id, name, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("roadmaps").select("analysis_session_id, prd_output, roadmap_overrides"),
      ]);
    if (sErr) throw sErr;
    if (fErr) throw fErr;

    const roadmapBySession = new Map<string, { prd: PRD | null; overrides: RoadmapOverrides }>();
    for (const r of roadmaps ?? []) {
      if (r.analysis_session_id) {
        roadmapBySession.set(r.analysis_session_id, {
          prd: (r.prd_output as unknown as PRD) ?? null,
          overrides: (r.roadmap_overrides as unknown as RoadmapOverrides) ?? {},
        });
      }
    }

    const entries: LibraryEntry[] = (sessions ?? []).map((s) => {
      const rm = s.id ? roadmapBySession.get(s.id) : undefined;
      const mode = (s.feedback_source === "research"
        ? "deep-research"
        : s.feedback_source ?? "paste") as LibraryEntry["mode"];
      return {
        id: s.id,
        title: s.title || s.product_name || "Untitled analysis",
        productName: s.product_name,
        businessGoal: s.business_goal ?? "",
        mode,
        source:
          mode === "paste"
            ? "Pasted feedback"
            : mode === "upload"
              ? "Uploaded file"
              : "Deep research",
        result: s.analysis_output as unknown as AnalysisResult,
        createdAt: new Date(s.created_at).getTime(),
        saved: !!s.saved,
        folderId: s.folder_id ?? null,
        roadmapOverrides: rm?.overrides ?? {},
        prd: rm?.prd ?? null,
        marketContext: (s.market_context_output as unknown as MarketContext) ?? null,
      };
    });

    return {
      entries,
      folders: (folders ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        createdAt: new Date(f.created_at).getTime(),
      })),
    };
  } catch (err) {
    console.error("[cloudSync.loadLibrary] failed:", err);
    return null;
  }
}
