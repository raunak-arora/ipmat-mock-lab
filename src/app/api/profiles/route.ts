import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, ADMIN_EMAIL } from "@/auth";

export async function GET() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
