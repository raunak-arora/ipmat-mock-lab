import { NextResponse } from "next/server";
import { auth, ADMIN_EMAIL } from "@/auth";
import { isAdmin } from "@/lib/is-admin";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admins = await prisma.allowedAdmin.findMany({ orderBy: { addedAt: "desc" } });
  return NextResponse.json({ admins, ownerEmail: ADMIN_EMAIL });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!await isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, name } = await req.json();
  if (!email || typeof email !== "string")
    return NextResponse.json({ error: "Email required" }, { status: 400 });

  const admin = await prisma.allowedAdmin.upsert({
    where: { email: email.trim().toLowerCase() },
    update: { name: name ?? null },
    create: { email: email.trim().toLowerCase(), name: name ?? null },
  });
  return NextResponse.json(admin);
}
