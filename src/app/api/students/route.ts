import { NextResponse } from "next/server";
import { auth, ADMIN_EMAIL } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const students = await prisma.allowedStudent.findMany({ orderBy: { addedAt: "desc" } });
  return NextResponse.json(students);
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, name } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const student = await prisma.allowedStudent.upsert({
    where: { email },
    update: { name: name ?? null },
    create: { email, name: name ?? null },
  });
  return NextResponse.json(student);
}
