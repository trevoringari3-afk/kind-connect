import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, userId, messageId } = await req.json();

    if (!content || !userId) {
      return new Response(
        JSON.stringify({ error: "Content and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI to analyze content for toxicity
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a content moderation system. Analyze the given text for toxicity, harassment, hate speech, threats, or inappropriate content. Use the provided function to return your analysis.`
          },
          {
            role: "user",
            content: `Analyze this message for toxicity: "${content}"`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_toxicity",
              description: "Report the toxicity analysis results",
              parameters: {
                type: "object",
                properties: {
                  toxicity_score: {
                    type: "number",
                    description: "A score from 0.0 to 1.0 where 0 is safe and 1 is highly toxic"
                  },
                  is_toxic: {
                    type: "boolean",
                    description: "Whether the content should be flagged as toxic (score > 0.5)"
                  },
                  categories: {
                    type: "array",
                    items: { type: "string" },
                    description: "Categories of toxicity detected (harassment, hate_speech, threat, sexual, spam, none)"
                  },
                  reason: {
                    type: "string",
                    description: "Brief explanation of why the content was flagged or cleared"
                  }
                },
                required: ["toxicity_score", "is_toxic", "categories", "reason"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "report_toxicity" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Service unavailable" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      // Return safe default on AI error
      return new Response(
        JSON.stringify({ is_toxic: false, toxicity_score: 0, categories: [], reason: "Analysis unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    let result = { is_toxic: false, toxicity_score: 0, categories: [] as string[], reason: "No issues detected" };

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool arguments:", e);
      }
    }

    // Log to moderation_logs if flagged
    if (result.is_toxic) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: logError } = await supabase.from("moderation_logs").insert({
        message_id: messageId || null,
        user_id: userId,
        content: content,
        toxicity_score: result.toxicity_score,
        is_flagged: true,
        flag_reason: result.reason,
      });

      if (logError) {
        console.error("Error logging moderation:", logError);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in check-toxicity:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
