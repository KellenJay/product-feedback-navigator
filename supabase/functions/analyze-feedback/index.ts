// Analyze customer feedback using Lovable AI Gateway with structured output via tool calling.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, businessGoal, mode, feedback, researchQuery } =
      await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!productName || typeof productName !== "string") {
      return new Response(
        JSON.stringify({ error: "Product name is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let userContent = "";
    if (mode === "deep-research") {
      userContent = `Product: ${productName}
Business goal: ${businessGoal || "(not specified)"}
Research request: ${researchQuery || productName}

You don't have live web access in this call. Synthesize a realistic,
representative analysis of common publicly-known feedback themes for this
product based on your training data. Be honest about themes; do not invent
specific quotes that you can't reasonably attribute. Use plausible
paraphrased quotes and label sentiment carefully.`;
    } else {
      if (!feedback || typeof feedback !== "string" || feedback.trim().length < 20) {
        return new Response(
          JSON.stringify({ error: "Please provide more feedback content to analyze." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      userContent = `Product: ${productName}
Business goal: ${businessGoal || "(not specified)"}

Feedback to analyze:
"""
${feedback.slice(0, 50000)}
"""`;
    }

    const systemPrompt = `You are a senior product manager analyzing user feedback.
Identify distinct pain points, score them by impact (0-100), assign categories
(e.g. Onboarding, Performance, Pricing, Reliability, UX, Support, Features),
priority (P0/P1/P2), and extract representative quotes.

Priority guidance:
- P0 = Critical: blocks core use or causes churn. Fix this sprint.
- P1 = High: significant friction for many users. Address in next 1-2 sprints.
- P2 = Medium: quality-of-life improvement. Backlog candidate.

For each quote, attempt to attribute the source when the input gives signal
(e.g. "from Reddit", a CSV column "source", a URL, a date). Use these fields:
  - source: short platform name like "Reddit", "Capterra", "G2", "App Store",
    "Support ticket", "Survey", "Twitter/X", or "Internal".
  - context: optional sub-context like "r/godaddy", "review #482", or a
    customer segment.
  - date: human-readable, e.g. "2 weeks ago" or "2025-03-14".
  - url: only include if the input explicitly contains a real URL for the
    quote. Otherwise leave it null. Do NOT fabricate URLs.

If you cannot reasonably infer a field, set it to null. Never invent sources.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "submit_analysis",
          description: "Return the structured feedback analysis.",
          parameters: {
            type: "object",
            properties: {
              reviewsAnalyzed: { type: "number" },
              overallSentiment: {
                type: "string",
                enum: ["Negative", "Mixed", "Positive"],
              },
              criticalIssuesCount: { type: "number" },
              topPainArea: { type: "string" },
              executiveSummary: { type: "string" },
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    impactScore: { type: "number" },
                    category: { type: "string" },
                    priority: { type: "string", enum: ["P0", "P1", "P2"] },
                    mentions: { type: "number" },
                    quotes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: { type: "string" },
                          source: { type: ["string", "null"] },
                          context: { type: ["string", "null"] },
                          date: { type: ["string", "null"] },
                          url: { type: ["string", "null"] },
                        },
                        required: ["text", "source", "context", "date", "url"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: [
                    "title",
                    "description",
                    "impactScore",
                    "category",
                    "priority",
                    "mentions",
                    "quotes",
                  ],
                  additionalProperties: false,
                },
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    detail: { type: "string" },
                  },
                  required: ["title", "detail"],
                  additionalProperties: false,
                },
              },
            },
            required: [
              "reviewsAnalyzed",
              "overallSentiment",
              "criticalIssuesCount",
              "topPainArea",
              "executiveSummary",
              "issues",
              "recommendations",
            ],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          tools,
          tool_choice: {
            type: "function",
            function: { name: "submit_analysis" },
          },
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured analysis." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-feedback error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
