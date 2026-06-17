import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/is-admin";

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dedup, audit] = await Promise.all([
    prisma.adminJob.findFirst({ where: { type: "DEDUP" }, orderBy: { startedAt: "desc" } }),
    prisma.adminJob.findFirst({ where: { type: "AUDIT" }, orderBy: { startedAt: "desc" } }),
  ]);

  return NextResponse.json({ dedup, audit });
}
