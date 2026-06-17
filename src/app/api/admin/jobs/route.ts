import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, ADMIN_EMAIL } from "@/auth";

export async function GET() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dedup, audit] = await Promise.all([
    prisma.adminJob.findFirst({ where: { type: "DEDUP" }, orderBy: { startedAt: "desc" } }),
    prisma.adminJob.findFirst({ where: { type: "AUDIT" }, orderBy: { startedAt: "desc" } }),
  ]);

  return NextResponse.json({ dedup, audit });
}
