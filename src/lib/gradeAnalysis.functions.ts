import { createServerFn } from "@tanstack/react-start";

export const gradeAnalysis = createServerFn({ method: "POST" })
  .inputValidator((input: { analysisOutput: unknown }) => input)
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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

    if (!response.ok) {
      const errText = await response.text();
      console.error("grade-analysis error:", response.status, errText);
      throw new Error("Grading failed.");
    }

    const payload = await response.json();
    const toolCall = payload?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No grades returned.");

    return JSON.parse(toolCall.function.arguments) as {
      prioritization_score: number;
      categorization_score: number;
      actionability_score: number;
      prd_completeness_score: number;
      total_score: number;
      reasoning: string;
    };
  });
