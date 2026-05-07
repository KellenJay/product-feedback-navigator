// Generate a Product Requirements Document from a roadmap, via Lovable AI Gateway.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a principal product manager with 20 years of experience shipping 
software at scale. Based on the roadmap provided, generate a complete, 
production-ready Product Requirements Document structured as follows. 
Return JSON only, no markdown, no preamble.

{
  "prd": {
    "title": "",
    "version": "v1.0",
    "status": "Draft",
    "overview": "",
    "problemStatement": "",
    "goals": [""],
    "nonGoals": [""],
    "epics": [
      {
        "id": "E1",
        "title": "",
        "description": "",
        "businessValue": "",
        "userStories": [
          {
            "id": "E1-S1",
            "title": "",
            "story": "As a [persona], I want [action] so that [outcome].",
            "acceptanceCriteria": [
              "Given [context], when [action], then [outcome]."
            ],
            "designNotes": "",
            "devNotes": "",
            "estimatedEffort": "L|M|H",
            "priority": "P1|P2|P3"
          }
        ]
      }
    ],
    "executionGuide": [
      {
        "phase": "Phase 1 — Foundation",
        "sprint": "Sprint 1-2",
        "focus": "",
        "tasks": [""],
        "dependencies": [""],
        "risks": [""],
        "recommendedApproach": ""
      }
    ],
    "successMetrics": [""],
    "openQuestions": [""]
  }
}`;

const tools = [
  {
    type: "function",
    function: {
      name: "submit_prd",
      description: "Return the structured PRD.",
      parameters: {
        type: "object",
        properties: {
          prd: {
            type: "object",
            properties: {
              title: { type: "string" },
              version: { type: "string" },
              status: { type: "string" },
              overview: { type: "string" },
              problemStatement: { type: "string" },
              goals: { type: "array", items: { type: "string" } },
              nonGoals: { type: "array", items: { type: "string" } },
              epics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    businessValue: { type: "string" },
                    userStories: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          title: { type: "string" },
                          story: { type: "string" },
                          acceptanceCriteria: {
                            type: "array",
                            items: { type: "string" },
                          },
                          designNotes: { type: "string" },
                          devNotes: { type: "string" },
                          estimatedEffort: {
                            type: "string",
                            enum: ["L", "M", "H"],
                          },
                          priority: {
                            type: "string",
                            enum: ["P1", "P2", "P3"],
                          },
                        },
                        required: [
                          "id",
                          "title",
                          "story",
                          "acceptanceCriteria",
                          "designNotes",
                          "devNotes",
                          "estimatedEffort",
                          "priority",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: [
                    "id",
                    "title",
                    "description",
                    "businessValue",
                    "userStories",
                  ],
                  additionalProperties: false,
                },
              },
              executionGuide: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    phase: { type: "string" },
                    sprint: { type: "string" },
                    focus: { type: "string" },
                    tasks: { type: "array", items: { type: "string" } },
                    dependencies: { type: "array", items: { type: "string" } },
                    risks: { type: "array", items: { type: "string" } },
                    recommendedApproach: { type: "string" },
                  },
                  required: [
                    "phase",
                    "sprint",
                    "focus",
                    "tasks",
                    "dependencies",
                    "risks",
                    "recommendedApproach",
                  ],
                  additionalProperties: false,
                },
              },
              successMetrics: { type: "array", items: { type: "string" } },
              openQuestions: { type: "array", items: { type: "string" } },
            },
            required: [
              "title",
              "version",
              "status",
              "overview",
              "problemStatement",
              "goals",
              "nonGoals",
              "epics",
              "executionGuide",
              "successMetrics",
              "openQuestions",
            ],
            additionalProperties: false,
          },
        },
        required: ["prd"],
        additionalProperties: false,
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, businessGoal, roadmapItems, executiveSummary } =
      await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!Array.isArray(roadmapItems) || roadmapItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Roadmap items are required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userContent = `Product: ${productName || "Untitled"}
Business goal: ${businessGoal || "(not specified)"}
${executiveSummary ? `\nExecutive summary:\n${executiveSummary}\n` : ""}
Roadmap (JSON):
${JSON.stringify(roadmapItems, null, 2)}

Use this roadmap to author the PRD. Group related items into 2-5 epics.
Generate at least one user story per roadmap item, with concrete
Given/When/Then acceptance criteria. Map roadmap effort/priority onto
each story. Build the executionGuide from the Now/Next/Later buckets.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          tools,
          tool_choice: {
            type: "function",
            function: { name: "submit_prd" },
          },
        }),
      },
    );

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
        JSON.stringify({ error: "PRD generation failed. Please try again." }),
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
        JSON.stringify({ error: "AI did not return structured PRD." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const prd = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(prd), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prd error:", e);
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
