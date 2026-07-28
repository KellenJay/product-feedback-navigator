import { createServerFn } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const gradeAnalysis = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((input: { analysisOutput: unknown; sessionId: string }) => {
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

    const analysisRecord = data.analysisOutput as Record<string, unknown>;
    const issues = Array.isArray(analysisRecord.issues) ? analysisRecord.issues : [];
    if (issues.length === 0) {
      console.error("gradeAnalysis: refusing to grade an analysis with no issues", {
        sessionId: data.sessionId,
        outputKeys: Object.keys(analysisRecord),
      });
      return { ok: false as const, reason: "empty_analysis" };
    }

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

Here are two reference examples to calibrate your scoring.

Example 1 — Bad analysis:
Input analysis:
{
  "executiveSummary": "Users are unhappy with the product.",
  "issues": [
    {
      "title": "Bad UX",
      "priority": "P1",
      "impactScore": 95,
      "description": "Users don't like the UX.",
      "recommendation": "Improve the UX.",
      "quotes": []
    },
    {
      "title": "Slow performance",
      "priority": "P1",
      "impactScore": 90,
      "description": "The app is slow.",
      "recommendation": "Make it faster.",
      "quotes": []
    },
    {
      "title": "Missing notifications",
      "priority": "P1",
      "impactScore": 88,
      "description": "Users want notifications.",
      "recommendation": "Add notifications.",
      "quotes": []
    }
  ]
}

Evaluation:
{
  "prioritization_score": 35,
  "categorization_score": 40,
  "actionability_score": 30,
  "prd_completeness_score": 25,
  "total_score": 32,
  "reasoning": "Every issue is marked P1 with no differentiation, so prioritization is not credible. Categories are vague ('Bad UX') and recommendations are generic, not tied to evidence. One-line descriptions and no quotes make the output too thin to write a PRD from."
}

Example 2 — Good analysis:
Input analysis:
{
  "executiveSummary": "Mobile users abandon checkout because the payment flow is buried, opaque, and lacks guest checkout. Fixing the top three issues could reduce checkout drop-off by an estimated 30-40%.",
  "issues": [
    {
      "title": "Guest checkout missing",
      "priority": "P1",
      "impactScore": 92,
      "description": "Forcing account creation before purchase causes a high drop-off rate on mobile, where users are impatient and distrust friction.",
      "recommendation": "Add a guest-checkout path that collects email only for order confirmation and offers account creation post-purchase.",
      "quotes": [
        "I got to the payment screen and it asked me to create an account. I just closed the app.",
        "Why do I need a password to buy one thing?"
      ]
    },
    {
      "title": "Total cost hidden until final step",
      "priority": "P2",
      "impactScore": 78,
      "description": "Shipping and tax are revealed late, creating a perceived price jump at the last step.",
      "recommendation": "Show an estimated order summary with shipping and tax as soon as the cart is opened, and update it live when the delivery address is entered.",
      "quotes": [
        "The price suddenly went up by $12 at the end. Felt like a trick.",
        "I couldn't see the final cost until I was supposed to pay."
      ]
    },
    {
      "title": "Payment confirmation is slow and unclear",
      "priority": "P3",
      "impactScore": 55,
      "description": "After tapping Pay, the spinner lasts several seconds with no clear status, making users think the transaction failed.",
      "recommendation": "Add a progress indicator and immediate confirmation state, and surface human-readable error messages on decline.",
      "quotes": [
        "I tapped pay and nothing happened for ages. I thought it didn't go through.",
        "It just said 'processing' forever. I paid twice by accident."
      ]
    }
  ]
}

Evaluation:
{
  "prioritization_score": 90,
  "categorization_score": 88,
  "actionability_score": 92,
  "prd_completeness_score": 85,
  "total_score": 88,
  "reasoning": "Priorities are well differentiated: guest checkout is correctly the only P1, while hidden costs and slow confirmation are P2/P3. Recommendations are specific and tied directly to quoted evidence. Issues are distinct and well named, and the analysis contains enough detail, including quotes, to write a PRD."
}

Now score the user's analysis on four dimensions, each 0–100:
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
