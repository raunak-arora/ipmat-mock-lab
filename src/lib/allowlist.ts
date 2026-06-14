import { prisma } from "@/lib/db";

export async function isStudentAllowed(email: string): Promise<boolean> {
  const entry = await prisma.allowedStudent.findUnique({ where: { email } });
  return !!entry;
}

export async function getOrCreateProfile(email: string, googleName: string) {
  // Sync Google display name into AllowedStudent so admin panel can show it.
  if (googleName) {
    await prisma.allowedStudent.updateMany({
      where: { email, name: null },
      data: { name: googleName },
    });
  }

  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) return existing;

  const name = googleName || email.split("@")[0];
  try {
    return await prisma.profile.create({ data: { name, email } });
  } catch {
    // Name collision — use email prefix
    return await prisma.profile.create({ data: { name: email.split("@")[0], email } });
  }
}
