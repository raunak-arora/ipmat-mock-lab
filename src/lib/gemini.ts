const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  const data: GeminiResponse = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return text;
}

function extractJson(raw: string): unknown {
  const match = raw.match(/```json\s*([\s\S]*?)```/) ?? raw.match(/\{[\s\S]*\}/);
  const jsonStr = match ? (match[1] ?? match[0]) : raw;
  return JSON.parse(jsonStr.trim());
}

export interface GeneratedQuestion {
  stem: string;
  options: string[] | null;
  answer: string;
  explanation: string;
}

export async function generateVariation(params: {
  subject: string;
  topic: string;
  difficulty: string;
  type: string;
  originalStem: string;
  originalAnswer: string;
  originalOptions: string[] | null;
}): Promise<GeneratedQuestion | null> {
  const optionsLine = params.originalOptions
    ? `Options: ${params.originalOptions.join(" | ")}`
    : "(Short answer — no options)";

  const prompt = `You are writing an IPMAT (Indian entrance exam) practice question.

Create ONE new question similar to the original below. Keep the same topic, difficulty, and question structure — but change the scenario, names, numbers, or values so it is a genuinely different question.

Subject: ${params.subject}
Topic: ${params.topic}
Difficulty: ${params.difficulty}
Type: ${params.type}

ORIGINAL QUESTION:
${params.originalStem}
${optionsLine}
Answer: ${params.originalAnswer}

Return ONLY valid JSON (no markdown, no explanation outside the JSON):
{
  "stem": "...",
  "options": ${params.type === "MCQ" ? '["...", "...", "...", "..."]' : "null"},
  "answer": "...",
  "explanation": "step-by-step solution in 2-4 sentences"
}

Rules:
- The answer MUST be one of the options (for MCQ)
- The explanation must clearly derive the answer
- Keep the same difficulty level
- Do not copy the original question`;

  try {
    const raw = await callGemini(prompt);
    const parsed = extractJson(raw) as GeneratedQuestion;
    if (!parsed.stem || !parsed.answer || !parsed.explanation) return null;
    if (params.type === "MCQ" && (!Array.isArray(parsed.options) || parsed.options.length < 4))
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function verifyQuestion(q: GeneratedQuestion): Promise<boolean> {
  const optionsLine = q.options
    ? `Options:\n${q.options.map((o, i) => `${i + 1}. ${o}`).join("\n")}`
    : "(Short answer)";

  const prompt = `Solve this IPMAT exam question independently and verify the given answer.

Question: ${q.stem}
${optionsLine}
Claimed answer: ${q.answer}
Claimed explanation: ${q.explanation}

Is the claimed answer CORRECT? Reply ONLY with valid JSON:
{
  "correct": true or false,
  "confidence": "high" or "low",
  "reason": "one sentence"
}`;

  try {
    const raw = await callGemini(prompt);
    const result = extractJson(raw) as { correct: boolean; confidence: string };
    return result.correct === true && result.confidence === "high";
  } catch {
    return false;
  }
}
