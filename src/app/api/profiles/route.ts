import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ADMIN_EMAIL } from "@/auth";

export async function GET() {
  const profiles = await prisma.profile.findMany({
    where: { email: { not: ADMIN_EMAIL } },
    orderBy: { createdAt: "asc" },
  });

  const emails = profiles.map((p) => p.email).filter(Boolean) as string[];
  const allowed = await prisma.allowedStudent.findMany({
    where: { email: { in: emails } },
    select: { email: true, name: true },
  });
  const nameByEmail = new Map(allowed.map((s) => [s.email, s.name]));

  return NextResponse.json(
    profiles.map((p) => ({
      id: p.id,
      name: (p.email && nameByEmail.get(p.email)) || p.name,
    }))
  );
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const profile = await prisma.profile.upsert({
    where: { name: name.trim() },
    update: {},
    create: { name: name.trim() },
  });
  return NextResponse.json(profile);
}
