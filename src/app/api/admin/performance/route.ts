import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

  const attempts = await prisma.attempt.findMany({
    where: profileId
      ? { profileId, submittedAt: { not: null } }
      : { submittedAt: { not: null } },
    orderBy: { submittedAt: "asc" },
    include: {
      profile: { select: { id: true, name: true } },
      answers: {
        select: {
          section: true,
          isCorrect: true,
          timeSpentSec: true,
          question: { select: { topic: true } },
        },
      },
    },
  });

  const series = attempts.map((a, i) => {
    // Aggregate time per section from individual question times.
    const sectionTimes: Record<string, number> = {};
    for (const ans of a.answers) {
      sectionTimes[ans.section] =
        (sectionTimes[ans.section] ?? 0) + ans.timeSpentSec;
    }
    return {
      id: a.id,
      index: i + 1,
      profileName: a.profile.name,
      profileId: a.profileId,
      exam: a.exam,
      mode: a.mode,
      date: a.submittedAt?.toISOString() ?? null,
      rawScore: a.rawScore ?? 0,
      maxScore: a.maxScore ?? 0,
      scorePct: Math.round(((a.rawScore ?? 0) / (a.maxScore || 1)) * 100),
      percentile: a.percentile ?? 0,
      clearedCutoff: a.clearedCutoff ?? false,
      sectionScores: JSON.parse(a.sectionScores ?? "{}") as Record<
        string,
        {
          score: number;
          max: number;
          correct: number;
          wrong: number;
          skipped: number;
          total: number;
          cutoff: number;
          clearedCutoff: boolean;
        }
      >,
      sectionTimes,
    };
  });

  // Cumulative topic accuracy across all attempts.
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
