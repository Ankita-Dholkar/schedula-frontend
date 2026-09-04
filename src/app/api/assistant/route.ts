import { NextRequest, NextResponse } from "next/server";
import { SCHEDULA_KNOWLEDGE } from "@/features/assistant/data/schedula-knowledge";
import type { AssistantRequest } from "@/features/assistant/types";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";


function buildSystemPrompt(role: string, pathname: string): string {
  const roleContext =
    role === "doctor"
      ? `The user is a DOCTOR using the Doctor Portal.`
      : role === "patient"
      ? `The user is a PATIENT using the Patient Portal.`
      : `The user is a general visitor on the Schedula homepage. They may be a patient looking to book appointments or a doctor looking to manage their clinic. Tailor your responses to be helpful for either use case.`;

  return `You are the Schedula Assistant, a helpful, friendly, and concise in-app guide for the Schedula clinic operations and appointment booking application.

ROLE CONTEXT:
- ${roleContext}
- They are currently on the page: "${pathname}".

YOUR RULES — FOLLOW THESE STRICTLY:
1. You ONLY answer questions about the Schedula application. If a question is unrelated, politely decline and redirect.
2. You are a READ-ONLY guide. You CANNOT perform any actions (book, cancel, reschedule, edit, delete) on behalf of users. Always tell users how to do things themselves.
3. Base your answers exclusively on the Schedula Knowledge Base provided below. Do not invent features or navigation paths.
4. Keep responses concise, friendly, and actionable. Use short paragraphs or bullet points.
5. If relevant, tell the user exactly which page to visit and what to look for (e.g., "Go to My Appointments in the sidebar").
6. Never provide medical advice or pretend to be a healthcare professional.
7. If you don't know the answer based on the knowledge base, say: "I'm not sure about that. Please contact your clinic's support team for more help."
8. You MUST return your response in JSON format exactly like this:
   {
     "answer": "Your detailed answer here...",
     "suggestions": ["Follow-up question 1?", "Follow-up question 2?", "Follow-up question 3?"]
   }
   The suggestions array should contain 2-3 short, relevant follow-up questions the user can click based on the context. If no good follow-ups exist, provide general ones.

SCHEDULA KNOWLEDGE BASE:
${SCHEDULA_KNOWLEDGE}
`;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured." },
        { status: 500 }
      );
    }

    const body: AssistantRequest = await req.json();
    const { role, pathname, question, history } = body;

    if (!role || !question?.trim()) {
      return NextResponse.json(
        { error: "Invalid request: role and question are required." },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(role, pathname ?? "/");

    // Build Gemini contents array
    // Gemini uses "user" / "model" roles
    const contents = [
      // Inject system prompt as a user→model exchange (Gemini 1.5 Flash pattern)
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I am the Schedula Assistant and I am ready to help.",
          },
        ],
      },
      // Include prior conversation history
      ...history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      // Current question
      {
        role: "user",
        parts: [{ text: question }],
      },
    ];

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "Failed to reach the AI service. Please try again." },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    let answer = "I wasn't able to generate a response. Please try again.";
    let suggestions: string[] = [];

    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      try {
        // Strip markdown code fences if present (e.g. ```json ... ```)
        const cleaned = rawText
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.answer) {
          answer = parsed.answer;
          suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
        } else {
          // JSON parsed but no 'answer' key – use the raw text as a plain answer
          answer = rawText.trim();
        }
      } catch {
        // Model returned plain text — use it directly as the answer
        answer = rawText.trim();
      }
    }

    return NextResponse.json({ answer, suggestions });
  } catch (err) {
    console.error("Assistant API route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
