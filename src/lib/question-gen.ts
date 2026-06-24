import { prisma } from "./db";
import { generateVariation, verifyQuestion, type GeneratedQuestion } from "./gemini";
import { generateQuantVariation, TEMPLATE_TOPICS } from "./quant-templates";

export const STALE_CORRECT_THRESHOLD = 5;
// How many new questions to generate per stale question.
const VARIATIONS_PER_QUESTION = 3;
// Max stale questions to process in one cron run (avoids long cold-starts).
const MAX_STALE_PER_RUN = 10;

export interface StaleQuestion {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  type: string;
  stem: string;
  options: string[] | null;
  answer: string;
  correctCount: number;
}

export async function findStaleQuestions(): Promise<StaleQuestion[]> {
  // Count correct answers per question, ordered by most-answered first.
  const counts = await prisma.attemptAnswer.groupBy({
    by: ["questionId"],
    where: { isCorrect: true },
    _count: { questionId: true },
    having: { questionId: { _count: { gte: STALE_CORRECT_THRESHOLD } } },
    orderBy: { _count: { questionId: "desc" } },
    take: MAX_STALE_PER_RUN,
  });
  if (counts.length === 0) return [];

  const ids = counts.map((c) => c.questionId);

  // Exclude questions that already have AI-generated children (already refreshed).
  const alreadyRefreshed = await prisma.question.findMany({
    where: { generatedFrom: { in: ids }, aiGenerated: true },
    select: { generatedFrom: true },
  });
  const refreshedSet = new Set(alreadyRefreshed.map((q) => q.generatedFrom!));
  const needRefresh = ids.filter((id) => !refreshedSet.has(id));
  if (needRefresh.length === 0) return [];

  const questions = await prisma.question.findMany({
    where: { id: { in: needRefresh } },
    select: { id: true, subject: true, topic: true, difficulty: true, type: true, stem: true, options: true, answer: true },
  });

  return questions.map((q) => ({
    ...q,
    options: q.options ? (JSON.parse(q.options) as string[]) : null,
    correctCount: counts.find((c) => c.questionId === q.id)?._count.questionId ?? 0,
  }));
}

export interface RefreshResult {
  added: number;
  byTopic: Record<string, number>;
  skipped: number;
}

export async function refreshStaleQuestions(): Promise<RefreshResult> {
  const stale = await findStaleQuestions();
  const result: RefreshResult = { added: 0, byTopic: {}, skipped: 0 };
  if (stale.length === 0) return result;

  for (const q of stale) {
    let generated = 0;
    for (let attempt = 0; attempt < VARIATIONS_PER_QUESTION + 2 && generated < VARIATIONS_PER_QUESTION; attempt++) {
      let candidate: GeneratedQuestion | null = null;

      // Use template for supported QUANT topics, Gemini for everything else.
      if (q.subject === "QUANT" && TEMPLATE_TOPICS.includes(q.topic)) {
        candidate = generateQuantVariation(q.topic);
      } else {
        candidate = await generateVariation({
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
          type: q.type,
          originalStem: q.stem,
          originalAnswer: q.answer,
          originalOptions: q.options,
        });
      }

      if (!candidate) { result.skipped++; continue; }

      // Verify non-template questions through Gemini.
      if (!(q.subject === "QUANT" && TEMPLATE_TOPICS.includes(q.topic))) {
        const ok = await verifyQuestion(candidate);
        if (!ok) { result.skipped++; continue; }
      }

      await prisma.question.create({
        data: {
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
          type: q.type,
          stem: candidate.stem,
          options: candidate.options ? JSON.stringify(candidate.options) : null,
          answer: candidate.answer,
          explanation: candidate.explanation,
          aiGenerated: true,
          generatedFrom: q.id,
          generatedAt: new Date(),
        },
      });

      generated++;
      result.added++;
      result.byTopic[q.topic] = (result.byTopic[q.topic] ?? 0) + 1;
    }
  }

  return result;
}
