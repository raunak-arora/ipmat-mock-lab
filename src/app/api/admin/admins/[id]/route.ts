import { NextResponse } from "next/server";
import { auth, ADMIN_EMAIL } from "@/auth";
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
  const { name } = await req.json();
  await prisma.allowedAdmin.update({ where: { id }, data: { name: name || null } });
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
  const record = await prisma.allowedAdmin.findUnique({ where: { id } });
  if (record?.email === ADMIN_EMAIL)
    return NextResponse.json({ error: "Cannot remove the owner account" }, { status: 400 });

  await prisma.allowedAdmin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
