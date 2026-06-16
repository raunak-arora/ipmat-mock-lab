import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, ADMIN_EMAIL } from "@/auth";

// Bulk import: accepts a JSON array of questions in the seed format.
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const items = Array.isArray(body)
    ? body
    : Array.isArray((body as { questions?: unknown })?.questions)
      ? (body as { questions: unknown[] }).questions
      : null;
  if (!items) {
    return NextResponse.json(
      { error: "Expected a JSON array of questions." },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  const valid: Array<Record<string, unknown>> = [];
  items.forEach((raw, i) => {
    const q = raw as Record<string, unknown>;
    if (!["QUANT", "VERBAL", "LR"].includes(q.subject as string))
      return errors.push(`#${i + 1}: bad subject`);
    if (!["MCQ", "SHORT_ANSWER"].includes(q.type as string))
      return errors.push(`#${i + 1}: bad type`);
    if (!q.topic || !q.stem || !q.answer)
      return errors.push(`#${i + 1}: missing topic/stem/answer`);
    if (q.type === "MCQ" && !Array.isArray(q.options))
      return errors.push(`#${i + 1}: MCQ needs options`);
    valid.push(q);
  });

  // Build a set of normalized stem keys already in the DB for the affected pools.
  const pools = [...new Set(valid.map((q) => `${q.subject}|${q.type}`))];
  const existing = await prisma.question.findMany({
    where: {
      OR: pools.map((p) => {
        const [subject, type] = p.split("|");
        return { subject, type };
      }),
    },
    select: { stem: true },
  });
  function normStem(s: string): string {
    return s
      .trim()
      .toLowerCase()
      .replace(/\[ipmat\s+\w+\s+\d{4}\]\s*/gi, "")
      .replace(/\(ipmat\s+\w+\s+\d{4}\)\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
  }
  const existingKeys = new Set(existing.map((q) => normStem(q.stem)));

  let inserted = 0;
  let skippedDup = 0;
  for (const q of valid) {
    const key = normStem(q.stem as string);
    if (existingKeys.has(key)) { skippedDup++; continue; }
    existingKeys.add(key);
    await prisma.question.create({
      data: {
        subject: q.subject as string,
        type: q.type as string,
        topic: q.topic as string,
        subTopic: (q.subTopic as string) ?? null,
        difficulty: (q.difficulty as string) ?? "MEDIUM",
        stem: q.stem as string,
        passage: (q.passage as string) ?? null,
        options: q.options ? JSON.stringify(q.options) : null,
        answer: q.answer as string,
        explanation: (q.explanation as string) ?? null,
        tags: q.tags ? JSON.stringify(q.tags) : null,
      },
    });
    inserted++;
  }

  return NextResponse.json({ inserted, skipped: errors.length + skippedDup, errors });
}
