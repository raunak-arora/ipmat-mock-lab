import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/is-admin";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const students = await prisma.allowedStudent.findMany({ orderBy: { addedAt: "desc" } });
  return NextResponse.json(students);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!await isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, name, allowedExams } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const allowedExamsJson = Array.isArray(allowedExams) && allowedExams.length > 0
    ? JSON.stringify(allowedExams)
    : undefined;

  const student = await prisma.allowedStudent.upsert({
    where: { email },
    update: { name: name ?? null, ...(allowedExamsJson ? { allowedExams: allowedExamsJson } : {}) },
    create: { email, name: name ?? null, ...(allowedExamsJson ? { allowedExams: allowedExamsJson } : {}) },
  });
  return NextResponse.json(student);
}
