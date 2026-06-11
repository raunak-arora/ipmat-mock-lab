import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const attempts = await prisma.attempt.findMany({
    where: { profileId, submittedAt: { not: null } },
    orderBy: { submittedAt: "asc" },
    include: {
      answers: { select: { isCorrect: true, question: { select: { topic: true } } } },
    },
  });

  const series = attempts.map((a, i) => ({
    id: a.id,
    index: i + 1,
    date: a.submittedAt?.toISOString() ?? null,
    exam: a.exam,
    mode: a.mode,
    rawScore: a.rawScore ?? 0,
    maxScore: a.maxScore ?? 0,
    scorePct: Math.round(((a.rawScore ?? 0) / (a.maxScore || 1)) * 100),
    percentile: a.percentile ?? 0,
    clearedCutoff: a.clearedCutoff ?? false,
  }));

  // Topic accuracy across all of this profile's attempts.
  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    for (const ans of a.answers) {
      const t = ans.question.topic;
      const s = topicMap.get(t) ?? { correct: 0, total: 0 };
      s.total += 1;
      if (ans.isCorrect) s.correct += 1;
      topicMap.set(t, s);
    }
  }
  const topics = [...topicMap.entries()]
    .map(([topic, s]) => ({
      topic,
      correct: s.correct,
      total: s.total,
      pct: Math.round((s.correct / s.total) * 100),
    }))
    .sort((a, b) => a.pct - b.pct);

  const completed = series.length;
  const avgPercentile =
    completed > 0
      ? series.reduce((sum, s) => sum + s.percentile, 0) / completed
      : 0;
  const bestScore = series.reduce((m, s) => Math.max(m, s.rawScore), 0);
  const clearRate =
    completed > 0
      ? Math.round(
          (series.filter((s) => s.clearedCutoff).length / completed) * 100
        )
      : 0;

  return NextResponse.json({
    series,
    topics,
    summary: { completed, avgPercentile, bestScore, clearRate },
  });
}
