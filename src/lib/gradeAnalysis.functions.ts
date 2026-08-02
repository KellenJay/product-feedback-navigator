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

You grade against an HHH framework adapted for InsightFlow: Helpful (does the output actually give a PM enough to act on and write a PRD from), Honest (is every claim traceable to a named, dated source rather than vague or invented attribution), and Harmless (no fabricated citations, no overstated certainty). Harmless is folded into the Honest score.

The four score fields map to the framework as follows:
- prd_completeness_score = Helpful
- categorization_score = Honest
- prioritization_score = Prioritization
- actionability_score = Actionability

Here are two reference examples to calibrate your scoring.

Example 1 — Bad analysis:
Input analysis:
{
  "executiveSummary": "Users have mixed feelings about the product.",
  "sentiment": "Mixed",
  "issues": [
    { "title": "Bad UX", "category": "UX", "priority": "P1", "impactScore": 95, "description": "Users don't like the UX.", "recommendation": "Improve UX.", "quotes": [{ "text": "The interface is hard to use.", "source": "Internal admin feedback", "date": "recent" }] },
    { "title": "Slow performance", "category": "Performance", "priority": "P1", "impactScore": 93, "description": "The app is slow.", "recommendation": "Address performance issues.", "quotes": [{ "text": "It takes a while to load.", "source": "Internal admin feedback", "date": "recent" }] },
    { "title": "Missing notifications", "category": "Feature", "priority": "P1", "impactScore": 91, "description": "Users want notifications.", "recommendation": "Add notifications.", "quotes": [{ "text": "I never know when something happens.", "source": "Internal admin feedback", "date": "recent" }] },
    { "title": "Confusing pricing", "category": "Pricing", "priority": "P1", "impactScore": 90, "description": "Pricing is confusing.", "recommendation": "Clarify pricing.", "quotes": [{ "text": "I don't know what I'm paying for.", "source": "Internal admin feedback", "date": "recent" }] },
    { "title": "Integrations", "category": "Feature", "priority": "P1", "impactScore": 89, "description": "Users want more integrations.", "recommendation": "Build more integrations.", "quotes": [{ "text": "Wish it worked with our stack.", "source": "Internal admin feedback", "date": "recent" }] }
  ],
  "marketContext": { "news": [{ "headline": "Category is growing", "source": "synthesized from public reviews" }] }
}

Evaluation:
{
  "prioritization_score": 20,
  "categorization_score": 25,
  "actionability_score": 30,
  "prd_completeness_score": 30,
  "total_score": 26,
  "reasoning": "Not honest: every quote is attributed to 'Internal admin feedback, recent' with no named source or date, and the market news cites 'synthesized from public reviews' rather than a publication, so nothing is verifiable. Not prioritized: all five issues are P1, which is the same as no prioritization. Not actionable or helpful: 'improve UX' and 'address performance issues' give no specific change, and one-line descriptions leave nothing to write a PRD from."
}

Example 2 — Good analysis:
Input analysis:
{
  "executiveSummary": "Negative — 4 of 5 issues relate to core workflow failures that block contract review from being completed in-product.",
  "sentiment": "Negative",
  "issues": [
    { "title": "Contract redlining requires exporting to Word", "category": "Feature", "priority": "P1", "impactScore": 91, "description": "Legal reviewers cannot edit clauses in-product, so every review round trips through Word and loses comment history.", "recommendation": "Add inline AI redlining to the contract editor, triggered on clause detection, with tracked changes preserved in-product.", "quotes": [{ "text": "We export to Word for every redline and paste it back. Comment history is gone by round three.", "source": "G2", "date": "March 2025" }] },
    { "title": "Bulk export times out above 1,000 records", "category": "Performance", "priority": "P1", "impactScore": 88, "description": "Exports silently fail after roughly 90 seconds, producing partial files with no error, which blocks monthly reporting.", "recommendation": "Move export to an async job that streams to a file, shows progress, and emails a download link on completion.", "quotes": [{ "text": "The monthly export dies halfway through every time.", "source": "Capterra", "date": "6 weeks ago" }] },
    { "title": "No SCIM auto-provisioning for SSO", "category": "Feature", "priority": "P2", "impactScore": 71, "description": "IT must create accounts manually after SSO login, slowing onboarding and generating help-desk tickets.", "recommendation": "Implement SCIM 2.0 provisioning and de-provisioning against the customer's identity provider.", "quotes": [{ "text": "SSO works but we still file a ticket for every new hire.", "source": "TrustRadius", "date": "December 2024" }] },
    { "title": "Clause search ignores defined terms", "category": "UX", "priority": "P2", "impactScore": 66, "description": "Search matches literal text only, so defined terms used elsewhere in the agreement are missed.", "recommendation": "Index defined terms at upload and expand search queries to their definitions.", "quotes": [{ "text": "Searching 'Confidential Information' misses half the clauses that reference it.", "source": "Reddit r/legaltech", "date": "January 2025" }] },
    { "title": "Invoice PDF lacks per-line tax breakdown", "category": "Pricing", "priority": "P3", "impactScore": 41, "description": "Finance reviewers retype invoices into a spreadsheet to see tax per line item.", "recommendation": "Add a per-line tax column and a jurisdiction subtotal to the invoice PDF template.", "quotes": [{ "text": "We rebuild the invoice in Excel monthly just for the tax split.", "source": "Product Hunt", "date": "February 2025" }] }
  ],
  "marketContext": { "news": [{ "headline": "AI contract review funding accelerates", "source": "TechCrunch", "date": "July 2025" }] }
}

Evaluation:
{
  "prioritization_score": 88,
  "categorization_score": 82,
  "actionability_score": 84,
  "prd_completeness_score": 85,
  "total_score": 85,
  "reasoning": "Honest: every quote carries a named source and a specific date, and market news cites TechCrunch with a month rather than 'general industry knowledge'. Prioritization is credible — two P1s reserved for genuine workflow blockers, two P2s, one P3, with impact scores that track the spread. Recommendations name the specific change ('inline AI redlining triggered on clause detection'), and descriptions plus quotes give enough substance to write a PRD."
}

Now score the user's analysis on four dimensions, each 0–100:
- prioritization_score (Prioritization): Is the P1/P2/P3 distribution sensible? P1s should be genuinely critical issues, not everything. Penalise heavily if >60% of issues are P1, or if obvious critical bugs are marked P3.
- categorization_score (Honest): Are claims traceable and categories distinct? Penalise vague or unexplained attribution ("internal admin feedback", "recent"), sources like "general industry knowledge" or "synthesized from public reviews", duplicate issues, and unjustified sentiment verdicts.
- actionability_score (Actionability): Are recommendations specific and tied to a quoted pain point? Penalise vague advice like "improve UX" or "address performance issues".
- prd_completeness_score (Helpful): Does the output have enough detail (impact scores, sourced quotes, descriptions, executive summary) to write a PRD from? Penalise missing quotes or one-line descriptions.
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
