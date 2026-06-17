import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/is-admin";
import { scoreAttempt, type GradableQuestion } from "@/lib/scoring";
import { estimatePercentile } from "@/lib/percentile";
import type { Exam, SectionKey } from "@/lib/examConfig";

// Optionally accepts a final { answers } payload (the same shape as PATCH) so the
// client can flush last-second changes atomically with submission.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const finalAnswers = body.answers as
    | Array<{ questionId: string; given: string | null; status: string; timeSpentSec: number }>
    | undefined;

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: { answers: { include: { question: true } } },
  });
  if (!attempt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!await isAdmin(session.user.email)) {
    const profile = await prisma.profile.findUnique({ where: { id: attempt.profileId } });
    if (!profile || profile.email !== session.user.email)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (attempt.submittedAt) {
    return NextResponse.json({ attemptId: id, alreadySubmitted: true });
  }

  // Flush any final answers first.
  if (finalAnswers?.length) {
    await prisma.$transaction(
      finalAnswers.map((a) =>
        prisma.attemptAnswer.updateMany({
          where: { attemptId: id, questionId: a.questionId },
          data: { given: a.given, status: a.status, timeSpentSec: a.timeSpentSec },
        })
      )
    );
  }

  // Reload the (possibly updated) answers.
  const fresh = await prisma.attemptAnswer.findMany({
    where: { attemptId: id },
    include: { question: true },
  });

  const exam = attempt.exam as Exam;
  const gradable: GradableQuestion[] = fresh.map((a) => ({
    id: a.questionId,
    section: a.section as SectionKey,
    type: a.question.type as "MCQ" | "SHORT_ANSWER",
    answer: a.question.answer,
  }));
  const submitted = fresh.map((a) => ({ questionId: a.questionId, given: a.given }));

  const { result, graded } = scoreAttempt(exam, gradable, submitted);
  const gradedById = new Map(graded.map((g) => [g.questionId, g]));
  const percentile = estimatePercentile(exam, result.rawScore);

  await prisma.$transaction([
    ...fresh.map((a) => {
      const g = gradedById.get(a.questionId)!;
      return prisma.attemptAnswer.update({
        where: { id: a.id },
        data: { isCorrect: g.isCorrect, marks: g.marks },
      });
    }),
    prisma.attempt.update({
      where: { id },
      data: {
        submittedAt: new Date(),
        rawScore: result.rawScore,
        maxScore: result.maxScore,
        sectionScores: JSON.stringify(result.sectionScores),
        percentile,
        clearedCutoff: result.clearedAllCutoffs,
      },
    }),
  ]);

  return NextResponse.json({ attemptId: id });
}
