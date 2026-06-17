import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/is-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!await isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

  const attempts = await prisma.attempt.findMany({
    where: profileId
      ? { profileId, submittedAt: { not: null } }
      : { submittedAt: { not: null } },
    orderBy: { submittedAt: "asc" },
    include: {
      profile: { select: { id: true, name: true, email: true } },
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

  // Build email→AllowedStudent.name map for display name overlay.
  const profileEmails = [...new Set(attempts.map((a) => a.profile.email).filter(Boolean))] as string[];
  const allowedStudents = await prisma.allowedStudent.findMany({
    where: { email: { in: profileEmails } },
    select: { email: true, name: true },
  });
  const nameByEmail = new Map(allowedStudents.map((s) => [s.email, s.name]));

  // Track per-profile attempt index for correct numbering.
  const profileIndexMap = new Map<string, number>();

  const series = attempts.map((a) => {
    const sectionScores: Record<string, { correct: number; wrong: number; skipped: number; max: number }> =
      JSON.parse(a.sectionScores ?? "{}");
    const effectiveMax =
      Object.values(sectionScores)
        .filter((ss) => ss.correct + ss.wrong + ss.skipped > 0)
        .reduce((sum, ss) => sum + ss.max, 0) ||
      a.maxScore ||
      1;

    const perStudentIdx = (profileIndexMap.get(a.profileId) ?? 0) + 1;
    profileIndexMap.set(a.profileId, perStudentIdx);

    // Aggregate time per section from individual question times.
    const sectionTimes: Record<string, number> = {};
    for (const ans of a.answers) {
      sectionTimes[ans.section] =
        (sectionTimes[ans.section] ?? 0) + ans.timeSpentSec;
    }

    const displayName =
      (a.profile.email && nameByEmail.get(a.profile.email)) || a.profile.name;

    return {
      id: a.id,
      index: perStudentIdx,
      profileName: displayName,
      profileId: a.profileId,
      exam: a.exam,
      mode: a.mode,
      date: a.submittedAt?.toISOString() ?? null,
      rawScore: a.rawScore ?? 0,
      maxScore: effectiveMax,
      scorePct: Math.round(((a.rawScore ?? 0) / effectiveMax) * 100),
      percentile: a.percentile ?? 0,
      clearedCutoff: a.clearedCutoff ?? false,
      sectionScores: sectionScores as Record<
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
