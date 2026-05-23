import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

async function callAI(system: string, user: string, tool?: { name: string; schema: any }) {
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

export const explainTopic = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ topic: z.string().min(2).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const text = await callAI(
      "You are a patient teacher for Pakistani students (matric/FSc/university). Explain in clear, simple English with one short example. Use markdown headings and bullet points. Keep under 300 words.",
      `Explain this topic: ${data.topic}`
    );
    return { text };
  });

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ notes: z.string().min(10).max(8000) }).parse(d))
  .handler(async ({ data }) => {
    const text = await callAI(
      "You summarize study notes for exam revision. Output: a 3-sentence overview, then 5-8 concise bullet points of key facts. Use markdown.",
      data.notes
    );
    return { text };
  });

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ topic: z.string().min(2).max(300) }).parse(d))
  .handler(async ({ data }) => {
    const result = await callAI(
      "You create exam-quality multiple-choice questions for Pakistani students. Each question has exactly 4 options and one correct answer.",
      `Generate 5 MCQs on: ${data.topic}`,
      {
        name: "make_quiz",
        schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              minItems: 5,
              maxItems: 5,
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                  answer_index: { type: "integer", minimum: 0, maximum: 3 },
                  explanation: { type: "string" },
                },
                required: ["question", "options", "answer_index", "explanation"],
              },
            },
          },
          required: ["questions"],
        },
      }
    );
    return result as { questions: { question: string; options: string[]; answer_index: number; explanation: string }[] };
  });

export const studyPlan = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ subject: z.string().min(2).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const result = await callAI(
      "You build focused 7-day study plans for Pakistani students preparing for exams. Each day has a clear topic, 3 tasks, and a time estimate in hours.",
      `Build a 7-day study plan for: ${data.subject}`,
      {
        name: "make_plan",
        schema: {
          type: "object",
          properties: {
            days: {
              type: "array",
              minItems: 7,
              maxItems: 7,
              items: {
                type: "object",
                properties: {
                  day: { type: "integer" },
                  topic: { type: "string" },
                  tasks: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
                  hours: { type: "number" },
                },
                required: ["day", "topic", "tasks", "hours"],
              },
            },
          },
          required: ["days"],
        },
      }
    );
    return result as { days: { day: number; topic: string; tasks: string[]; hours: number }[] };
  });
