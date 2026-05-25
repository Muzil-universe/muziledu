const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

export async function callAI(system: string, user: string, tool?: { name: string; schema: any }) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI service not configured");
  const body: any = {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (tool) {
    body.tools = [{ type: "function", function: { name: tool.name, description: "Return structured output", parameters: tool.schema } }];
    body.tool_choice = { type: "function", function: { name: tool.name } };
  }
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in your workspace.");
    throw new Error(`AI error (${res.status})`);
  }
  const data = await res.json();
  if (tool) {
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    return JSON.parse(call.function.arguments);
  }
  return data.choices?.[0]?.message?.content ?? "";
}
