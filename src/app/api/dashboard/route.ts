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

  const series = attempts.map((a, i) => {
    // Compute effective max from active sections only (fixes sectional mocks and old data stored with full-exam max).
    const sectionScores: Record<string, { correct: number; wrong: number; skipped: number; max: number }> =
      JSON.parse(a.sectionScores ?? "{}");
    const effectiveMax =
      Object.values(sectionScores)
        .filter((ss) => ss.correct + ss.wrong + ss.skipped > 0)
        .reduce((sum, ss) => sum + ss.max, 0) ||
      a.maxScore ||
      1;
    return {
      id: a.id,
      index: i + 1,
      date: a.submittedAt?.toISOString() ?? null,
      exam: a.exam,
      mode: a.mode,
      rawScore: a.rawScore ?? 0,
      maxScore: effectiveMax,
      scorePct: Math.round(((a.rawScore ?? 0) / effectiveMax) * 100),
      percentile: a.percentile ?? 0,
      clearedCutoff: a.clearedCutoff ?? false,
    };
  });

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
