import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, ADMIN_EMAIL } from "@/auth";

export async function GET() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const usage = await prisma.attemptAnswer.groupBy({
    by: ["questionId"],
    _count: { _all: true },
    orderBy: { _count: { questionId: "desc" } },
    take: 100,
  });

  if (usage.length === 0) return NextResponse.json({ stats: [] });

  const qIds = usage.map((u) => u.questionId);

  const correctRows = await prisma.attemptAnswer.groupBy({
    by: ["questionId"],
    where: { questionId: { in: qIds }, isCorrect: true },
    _count: { _all: true },
  });
  const correctMap = new Map(correctRows.map((c) => [c.questionId, c._count._all]));

  const questions = await prisma.question.findMany({
    where: { id: { in: qIds } },
    select: { id: true, stem: true, topic: true, subject: true, difficulty: true },
  });
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const stats = usage
    .map((u) => ({
      questionId: u.questionId,
      total: u._count._all,
      correct: correctMap.get(u.questionId) ?? 0,
      successRate: Math.round(((correctMap.get(u.questionId) ?? 0) / u._count._all) * 100),
      question: questionMap.get(u.questionId),
    }))
    .filter((s) => s.question != null);

  return NextResponse.json({ stats });
}
