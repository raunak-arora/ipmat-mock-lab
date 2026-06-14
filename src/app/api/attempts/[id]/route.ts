import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, ADMIN_EMAIL } from "@/auth";
import type { RunnerQuestion, SavedAnswer } from "@/lib/types";
import type { SectionKey, QType } from "@/lib/examConfig";

async function authorizeAttempt(attemptId: string, email: string) {
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return { attempt: null, denied: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (email !== ADMIN_EMAIL) {
    const profile = await prisma.profile.findUnique({ where: { id: attempt.profileId } });
    if (!profile || profile.email !== email)
      return { attempt: null, denied: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { attempt, denied: null };
}

// Fetch an attempt for the runner — questions WITHOUT the answer key.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { attempt, denied } = await authorizeAttempt(id, session.user.email);
  if (denied) return denied;

  const full = await prisma.attempt.findUnique({
    where: { id },
    include: {
      answers: { include: { question: true }, orderBy: { order: "asc" } },
    },
  });
  if (!full) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questions: RunnerQuestion[] = full.answers.map((a) => ({
    id: a.questionId,
    order: a.order,
    section: a.section as SectionKey,
    type: a.question.type as QType,
    topic: a.question.topic,
    stem: a.question.stem,
    passage: a.question.passage,
    options: a.question.options ? JSON.parse(a.question.options) : null,
  }));

  const saved: SavedAnswer[] = full.answers.map((a) => ({
    questionId: a.questionId,
    given: a.given,
    status: a.status,
    timeSpentSec: a.timeSpentSec,
  }));

  return NextResponse.json({
    id: full.id,
    exam: full.exam,
    mode: full.mode,
    startedAt: full.startedAt.toISOString(),
    submittedAt: full.submittedAt?.toISOString() ?? null,
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
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { attempt, denied } = await authorizeAttempt(id, session.user.email);
  if (denied) return denied;
  if (attempt!.submittedAt)
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });

  const body = await req.json();
  const answers: SavedAnswer[] = body.answers ?? [];

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
