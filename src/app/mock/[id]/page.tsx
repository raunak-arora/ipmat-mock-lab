import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ExamRunner from "@/components/ExamRunner";
import type { RunnerQuestion, SavedAnswer } from "@/lib/types";
import type { Exam, SectionKey, QType } from "@/lib/examConfig";

export const dynamic = "force-dynamic";

export default async function MockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: {
      answers: { include: { question: true }, orderBy: { order: "asc" } },
    },
  });
  if (!attempt) notFound();
  if (attempt.submittedAt) redirect(`/results/${id}`);

  const questions: RunnerQuestion[] = attempt.answers.map((a) => ({
    id: a.questionId,
    order: a.order,
    section: a.section as SectionKey,
    type: a.question.type as QType,
    topic: a.question.topic,
    stem: a.question.stem,
    passage: a.question.passage,
    options: a.question.options ? JSON.parse(a.question.options) : null,
  }));

  const saved: SavedAnswer[] = attempt.answers.map((a) => ({
    questionId: a.questionId,
    given: a.given,
    status: a.status,
    timeSpentSec: a.timeSpentSec,
  }));

  return (
    <ExamRunner
      data={{
        id: attempt.id,
        exam: attempt.exam as Exam,
        mode: attempt.mode,
        startedAt: attempt.startedAt.toISOString(),
        serverNow: new Date().toISOString(),
        questions,
        saved,
      }}
    />
  );
}
