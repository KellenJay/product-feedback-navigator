// Market context synthesis using Lovable AI Gateway with structured output via tool calling.
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
    const { productName, businessGoal, topPainPoints } = await req.json();

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

    const today = new Date().toISOString().slice(0, 10);
    const painList = Array.isArray(topPainPoints)
      ? topPainPoints
          .slice(0, 3)
          .map(
            (p: { title: string; impactScore: number }, i: number) =>
              `${i + 1}. ${p.title} (impact ${p.impactScore})`,
          )
          .join("\n")
      : "(none provided)";

    const userContent = `Product: ${productName}
Business goal: ${businessGoal || "(not specified)"}
Today: ${today}

Top pain points from feedback analysis:
${painList}

Synthesize market context for this product based on your training data.`;

    const systemPrompt = `You are a senior market research analyst with 20+ years of experience in SaaS and technology products.

You do NOT have live web access. Synthesize plausible, representative market context from your training data. Be honest about uncertainty.

Hard rules:
- Never fabricate specific URLs.
- Never invent precise dollar figures you aren't confident in. If unsure about market size, set marketSize.confident = false and leave statement empty.
- For every trend / competitor / news item, the "source" field must honestly attribute the synthesis (e.g. "Synthesized from public reviews & coverage", "Based on category trends through 2025", "General industry knowledge").
- News dates must be plausible and within the last 90 days relative to today's date provided.
- Verdict outcome rules:
  * "validates" — market signals broadly align with the user's pain points (their findings are consistent with what competitors / industry are addressing).
  * "mixed" — partial alignment, some signals contradict.
  * "contradicts" — market signals suggest the user's pain points are minor or already solved by competitors.
- Verdict.reasoning should be a concise chain-of-thought explanation (3-5 sentences) the user can audit.
- Return 2-3 trends, exactly 3 competitors, 3-4 news items.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "submit_market_context",
          description: "Return structured market context.",
          parameters: {
            type: "object",
            properties: {
              trends: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    statement: { type: "string" },
                    direction: {
                      type: "string",
                      enum: ["growing", "stable", "declining"],
                    },
                    source: { type: "string" },
                  },
                  required: ["statement", "direction", "source"],
                  additionalProperties: false,
                },
              },
              competitors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    approach: { type: "string" },
                    signal: {
                      type: "string",
                      enum: ["Ahead", "Watching", "Lagging"],
                    },
                  },
                  required: ["name", "approach", "signal"],
                  additionalProperties: false,
                },
              },
              news: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    summary: { type: "string" },
                    source: { type: "string" },
                    date: { type: "string" },
                  },
                  required: ["headline", "summary", "source", "date"],
                  additionalProperties: false,
                },
              },
              marketSize: {
                type: "object",
                properties: {
                  statement: { type: "string" },
                  confident: { type: "boolean" },
                },
                required: ["statement", "confident"],
                additionalProperties: false,
              },
              verdict: {
                type: "object",
                properties: {
                  outcome: {
                    type: "string",
                    enum: ["validates", "mixed", "contradicts"],
                  },
                  label: { type: "string" },
                  rationale: { type: "string" },
                  reasoning: { type: "string" },
                },
                required: ["outcome", "label", "rationale", "reasoning"],
                additionalProperties: false,
              },
            },
            required: [
              "trends",
              "competitors",
              "news",
              "marketSize",
              "verdict",
            ],
            additionalProperties: false,
          },
        },
      },
    ];

    const callGateway = () =>
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
          tool_choice: {
            type: "function",
            function: { name: "submit_market_context" },
          },
        }),
      });

    // Retry on transient upstream failures (502/503/504) with exponential backoff.
    let response = await callGateway();
    let attempts = 0;
    while (
      !response.ok &&
      [502, 503, 504].includes(response.status) &&
      attempts < 2
    ) {
      attempts++;
      await new Promise((r) => setTimeout(r, 600 * attempts));
      response = await callGateway();
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit reached. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in your workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Market context generation failed." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured context." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const context = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(context), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("market-context error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
