import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/is-admin";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!await isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const updates: { name?: string | null; allowedExams?: string } = {};
  if ("name" in body) updates.name = body.name || null;
  if ("allowedExams" in body && Array.isArray(body.allowedExams)) {
    updates.allowedExams = JSON.stringify(body.allowedExams);
  }
  await prisma.allowedStudent.update({ where: { id }, data: updates });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!await isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.allowedStudent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
