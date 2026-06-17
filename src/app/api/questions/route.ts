import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, ADMIN_EMAIL } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject") ?? undefined;
  const questions = await prisma.question.findMany({
    where: subject ? { subject } : undefined,
    orderBy: [{ subject: "asc" }, { topic: "asc" }],
  });
  const counts = await prisma.question.groupBy({
    by: ["subject", "type"],
    _count: true,
  });
  const withExplanation = await prisma.question.count({
    where: { explanation: { not: null } },
  });
  return NextResponse.json({
    questions: questions.map((q) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null,
      tags: q.tags ? JSON.parse(q.tags) : null,
    })),
    counts,
    withExplanation,
  });
}

function validate(q: Record<string, unknown>): string | null {
  if (!["QUANT", "VERBAL", "LR"].includes(q.subject as string))
    return "subject must be QUANT, VERBAL or LR";
  if (!["MCQ", "SHORT_ANSWER"].includes(q.type as string))
    return "type must be MCQ or SHORT_ANSWER";
  if (!q.topic) return "topic is required";
  if (!q.stem) return "stem is required";
  if (!q.answer) return "answer is required";
  if (q.type === "MCQ" && (!Array.isArray(q.options) || q.options.length < 2))
    return "MCQ needs at least 2 options";
  if (
    q.type === "MCQ" &&
    !(q.options as string[]).includes(q.answer as string)
  )
    return "answer must match one of the options";
  return null;
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const created = await prisma.question.create({
    data: {
      subject: body.subject,
      type: body.type,
      topic: body.topic,
      subTopic: body.subTopic ?? null,
      difficulty: body.difficulty ?? "MEDIUM",
      stem: body.stem,
      passage: body.passage ?? null,
      options: body.options ? JSON.stringify(body.options) : null,
      answer: body.answer,
      explanation: body.explanation ?? null,
      tags: body.tags ? JSON.stringify(body.tags) : null,
    },
  });
  return NextResponse.json(created);
}
