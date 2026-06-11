import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { RunnerQuestion, SavedAnswer } from "@/lib/types";
import type { SectionKey, QType } from "@/lib/examConfig";

// Fetch an attempt for the runner — questions WITHOUT the answer key.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: {
      answers: { include: { question: true }, orderBy: { order: "asc" } },
    },
  });
  if (!attempt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

  return NextResponse.json({
    id: attempt.id,
    exam: attempt.exam,
    mode: attempt.mode,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    serverNow: new Date().toISOString(),
    questions,
    saved,
  });
}

// Autosave progress: an array of { questionId, given, status, timeSpentSec }.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const answers: SavedAnswer[] = body.answers ?? [];

  const attempt = await prisma.attempt.findUnique({ where: { id } });
  if (!attempt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (attempt.submittedAt) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  await prisma.$transaction(
    answers.map((a) =>
      prisma.attemptAnswer.updateMany({
        where: { attemptId: id, questionId: a.questionId },
        data: {
          given: a.given,
          status: a.status,
          timeSpentSec: a.timeSpentSec,
        },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
