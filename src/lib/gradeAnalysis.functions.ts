import { createServerFn } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const gradeAnalysis = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((input: { analysisOutput: unknown; sessionId: string }) => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid grading input");
    }
    if (typeof input.sessionId !== "string" || !input.sessionId.trim()) {
      throw new Error("A saved analysis sessionId is required for grading");
    }
    if (input.analysisOutput === null || typeof input.analysisOutput !== "object") {
      throw new Error("A valid analysisOutput is required for grading");
    }
    return {
      analysisOutput: input.analysisOutput,
      sessionId: input.sessionId.trim(),
    };
  })
  .handler(async ({ data, context }) => {
    try {
      const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
      if (!LOVABLE_API_KEY) {
        console.error("gradeAnalysis: LOVABLE_API_KEY not configured");
        return { ok: false as const, reason: "missing_key" };
      }

    console.info("gradeAnalysis: received grading request", {
      sessionId: data.sessionId,
      userId: context.userId,
    });

    const { data: savedSession, error: sessionError } = await context.supabase
      .from("analysis_sessions")
      .select("id")
      .eq("id", data.sessionId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (sessionError || !savedSession) {
      console.error("gradeAnalysis: saved analysis session not found", {
        sessionId: data.sessionId,
        error: sessionError,
      });
      return { ok: false as const, reason: "invalid_session" };
    }

    const systemPrompt = `You are an expert evaluator of AI-generated product analyses.
Score the analysis on four dimensions, each 0–100:
- prioritization_score: Is the P1/P2/P3 distribution sensible? P1s should be genuinely critical issues, not everything. Penalise if >60% of issues are P1, or if obvious critical bugs are marked P3.
- categorization_score: Are issues distinct and well-named? Penalise duplicates, vague categories, or issues that should be merged.
- actionability_score: Are recommendations specific and tied to evidence? Penalise vague advice like "improve UX" with no concrete direction.
- prd_completeness_score: Does the output have enough detail (impact scores, quotes, descriptions, executive summary) to write a PRD from? Penalise missing quotes or one-line descriptions.
total_score = average of the four.
reasoning = 2–3 sentences explaining the scores honestly.`;

    const userContent = `Grade this feedback analysis output:\n${JSON.stringify(data.analysisOutput, null, 2)}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "submit_grades",
          description: "Return the evaluation scores.",
          parameters: {
            type: "object",
            properties: {
              prioritization_score: { type: "number" },
              categorization_score: { type: "number" },
              actionability_score: { type: "number" },
              prd_completeness_score: { type: "number" },
              total_score: { type: "number" },
              reasoning: { type: "string" },
            },
            required: [
              "prioritization_score",
              "categorization_score",
              "actionability_score",
              "prd_completeness_score",
              "total_score",
              "reasoning",
            ],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "submit_grades" } },
      }),
    });

    const rawResponse = await response.text();
    console.info("gradeAnalysis: raw gateway response", {
      sessionId: data.sessionId,
      status: response.status,
      runId: response.headers.get("X-Lovable-AIG-Run-ID"),
      logId: response.headers.get("X-Lovable-AIG-Log-ID"),
      body: rawResponse,
    });

    if (!response.ok) {
      console.error("grade-analysis error:", response.status, rawResponse);
      return { ok: false as const, reason: "gateway_error", status: response.status };
    }

    let payload: {
      choices?: Array<{
        message?: {
          tool_calls?: Array<{ function?: { arguments?: string } }>;
        };
      }>;
    };
    try {
      payload = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error("gradeAnalysis: gateway returned invalid JSON", parseError);
      return { ok: false as const, reason: "invalid_gateway_json" };
    }

    const toolCall = payload?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("gradeAnalysis: gateway response had no grading tool call", {
        sessionId: data.sessionId,
      });
      return { ok: false as const, reason: "no_tool_call" };
    }

    const parsedGrades = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
    const scoreKeys = [
      "prioritization_score",
      "categorization_score",
      "actionability_score",
      "prd_completeness_score",
      "total_score",
    ] as const;
    const scores = Object.fromEntries(
      scoreKeys.map((key) => [key, Number(parsedGrades[key])]),
    ) as Record<(typeof scoreKeys)[number], number>;

    const invalidScore = scoreKeys.find(
      (key) => !Number.isFinite(scores[key]) || scores[key] < 0 || scores[key] > 100,
    );
    if (invalidScore || typeof parsedGrades.reasoning !== "string") {
      console.error("gradeAnalysis: invalid grades returned by gateway", {
        sessionId: data.sessionId,
        invalidScore,
        parsedGrades,
      });
      return { ok: false as const, reason: "invalid_grades" };
    }

    const grades = {
      prioritization_score: scores.prioritization_score,
      categorization_score: scores.categorization_score,
      actionability_score: scores.actionability_score,
      prd_completeness_score: scores.prd_completeness_score,
      total_score: scores.total_score,
      reasoning: parsedGrades.reasoning,
    };

    const { data: evalRun, error: insertError } = await context.supabase
      .from("eval_runs")
      .insert({
        user_id: context.userId,
        analysis_session_id: savedSession.id,
        prioritization_score: Math.round(grades.prioritization_score),
        categorization_score: Math.round(grades.categorization_score),
        actionability_score: Math.round(grades.actionability_score),
        prd_completeness_score: Math.round(grades.prd_completeness_score),
        total_score: Math.round(grades.total_score),
        grader_output: grades,
      })
      .select("id, analysis_session_id")
      .single();

    if (insertError || !evalRun) {
      console.error("eval_runs insert failed:", insertError);
      return { ok: false as const, reason: "insert_failed" };
    }

    console.info("gradeAnalysis: saved evaluation", {
      evalRunId: evalRun.id,
      analysisSessionId: evalRun.analysis_session_id,
      totalScore: Math.round(grades.total_score),
    });

      return { ok: true as const, grades, evalRunId: evalRun.id };
    } catch (err) {
      console.error("gradeAnalysis unexpected error:", err);
      return { ok: false as const, reason: "exception" };
    }
  });
