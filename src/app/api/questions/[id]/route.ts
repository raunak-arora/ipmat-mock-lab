import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of [
    "subject",
    "type",
    "topic",
    "subTopic",
    "difficulty",
    "stem",
    "passage",
    "answer",
    "explanation",
  ]) {
    if (key in body) data[key] = body[key];
  }
  if ("options" in body)
    data.options = body.options ? JSON.stringify(body.options) : null;
  if ("tags" in body) data.tags = body.tags ? JSON.stringify(body.tags) : null;

  const updated = await prisma.question.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Keep questions referenced by past attempts; only delete if unused.
  const used = await prisma.attemptAnswer.count({ where: { questionId: id } });
  if (used > 0) {
    return NextResponse.json(
      { error: `Cannot delete — used in ${used} attempt answer(s).` },
      { status: 409 }
    );
  }
  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
