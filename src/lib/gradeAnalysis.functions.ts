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
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      if (!OPENAI_API_KEY) {
        console.error("gradeAnalysis: OPENAI_API_KEY not configured");
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

Here are three reference examples to calibrate your scoring.

CALIBRATION EXAMPLE 1: BAD OUTPUT
Input analysis:
{
  "executiveSummary": "Users have mixed feelings about the product.",
  "sentiment": "Mixed",
  "issues": [
    {
      "title": "Bad UX",
      "category": "UX",
      "priority": "P1",
      "impactScore": 95,
      "description": "Users don't like the UX.",
      "recommendation": "Improve the UX.",
      "quotes": [
        {
          "text": "The interface is hard to use.",
          "source": "internal admin feedback",
          "date": "recent"
        }
      ]
    },
    {
      "title": "Slow performance",
      "category": "Performance",
      "priority": "P1",
      "impactScore": 90,
      "description": "The app is slow.",
      "recommendation": "Make it faster.",
      "quotes": [
        {
          "text": "It takes a while to load.",
          "source": "internal admin feedback",
          "date": "recent"
        }
      ]
    },
    {
      "title": "Missing notifications",
      "category": "Feature",
      "priority": "P1",
      "impactScore": 88,
      "description": "Users want notifications.",
      "recommendation": "Add notifications.",
      "quotes": [
        {
          "text": "I never know when something happens.",
          "source": "internal admin feedback",
          "date": "recent"
        }
      ]
    }
  ]
}

Market news in this analysis cites "synthesized from public reviews" with no publication name.

Evaluation:
{
  "prioritization_score": 20,
  "categorization_score": 35,
  "actionability_score": 25,
  "prd_completeness_score": 30,
  "total_score": 28,
  "reasoning": "Prioritization is 20 because every issue is P1, so there is no real ranking. Categorization is 35 because categories are generic buckets ('UX', 'Performance') applied to overlapping, vaguely titled issues. Actionability is 25 because recommendations like 'improve the UX' and 'make it faster' name no concrete change tied to evidence. PRD completeness is 30 because sentiment is 'Mixed' with no justification, descriptions are one line, quotes are dated only as 'recent', sources say 'internal admin feedback' with no context about what internal means, and market news is cited as 'synthesized from public reviews' with no publication name."
}

--- CALIBRATION EXAMPLE 2: AVERAGE OUTPUT (~55/100) ---
Analysis has a P1/P2/P3 spread but no rationale explaining why issues were ranked that way. Categories are specific (Performance, Pricing, UX) but one recommendation is generic ("improve onboarding"). Quotes are present and attributed to named platforms (Reddit, G2) but no dates are given. Sentiment is "Mixed" with a one-sentence justification that is plausible but thin. Market context is labelled as synthesized.
Expected scores: prioritization=55, categorization=65, actionability=50, prd_completeness=50, total=55
--- END CALIBRATION EXAMPLE 2 ---

CALIBRATION EXAMPLE 3: GOOD OUTPUT
Input analysis:
{
  "executiveSummary": "Negative — 3 of the 4 P1 issues relate to core workflow failures that block users from completing key tasks, which is driving churn among mid-market teams.",
  "sentiment": "Negative",
  "issues": [
    {
      "title": "Bulk export fails for accounts with >1,000 records",
      "category": "Performance",
      "priority": "P1",
      "impactScore": 92,
      "description": "Enterprise users exporting large datasets hit a silent timeout after ~90 seconds, leaving them with partial files and no error message. This blocks monthly reporting workflows.",
      "recommendation": "Replace the synchronous export endpoint with a streaming job that writes to a downloadable file, surfaces progress in the UI, and emails a link on completion.",
      "quotes": [
        {
          "text": "Our monthly report export dies halfway through every time. We have to ask an engineer to pull it from the database.",
          "source": "G2",
          "date": "3 months ago"
        },
        {
          "text": "Exporting anything over a few thousand rows just hangs. No error, just a spinning wheel.",
          "source": "Capterra, Jan 2025"
        }
      ]
    },
    {
      "title": "SSO auto-provisioning is not supported",
      "category": "Feature",
      "priority": "P2",
      "impactScore": 74,
      "description": "IT teams must manually create accounts after SSO login, which slows onboarding and increases help-desk tickets.",
      "recommendation": "Add SCIM 2.0 auto-provisioning so accounts are created and de-provisioned from the identity provider automatically.",
      "quotes": [
        {
          "text": "We love the SSO, but we still have to open a ticket to get every new hire added.",
          "source": "TrustRadius, Dec 2024"
        }
      ]
    },
    {
      "title": "Invoice PDF layout is missing line-item tax breakdown",
      "category": "UX",
      "priority": "P3",
      "impactScore": 48,
      "description": "Finance reviewers need to manually calculate tax per line because the invoice PDF only shows a single tax total.",
      "recommendation": "Update the invoice PDF template to include a per-line-item tax column and a subtotal breakdown by jurisdiction.",
      "quotes": [
        {
          "text": "Our finance team retypes the invoice into a spreadsheet every month just to see the tax breakdown.",
          "source": "Product Hunt, 2 weeks ago"
        }
      ]
    }
  ]
}

Market news in this analysis cites named publications (e.g. "TechCrunch, Feb 2025") rather than generic phrases.

Evaluation:
{
  "prioritization_score": 85,
  "categorization_score": 82,
  "actionability_score": 84,
  "prd_completeness_score": 88,
  "total_score": 85,
  "reasoning": "Prioritization is 85 because P1 is reserved for a genuine blocker (bulk export failure) while SSO and invoice layout sit correctly at P2/P3. Categorization is 82 because Feature, Performance, and UX are distinct and each issue is specifically titled with no duplication. Actionability is 84 because each recommendation names a concrete change (streaming export job, SCIM 2.0 provisioning, per-line tax column) tied directly to a quoted pain point. PRD completeness is 88 because the sentiment verdict states its reason, descriptions explain impact, quotes carry named sources and specific dates like 'G2, March 2025', and market news cites actual publications."
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
