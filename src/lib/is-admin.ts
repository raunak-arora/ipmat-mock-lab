import { prisma } from "@/lib/db";
import { ADMIN_EMAIL } from "@/auth";

export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (email === ADMIN_EMAIL) return true;
  const found = await prisma.allowedAdmin.findFirst({ where: { email } });
  return !!found;
}
