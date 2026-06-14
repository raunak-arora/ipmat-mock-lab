import { prisma } from "@/lib/db";

export async function isStudentAllowed(email: string): Promise<boolean> {
  const entry = await prisma.allowedStudent.findUnique({ where: { email } });
  return !!entry;
}

export async function getOrCreateProfile(email: string, googleName: string) {
  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) {
    // Keep the name in sync with Google, but only if the new name isn't
    // already taken by a different profile (name is @unique in the schema).
    if (googleName && existing.name !== googleName) {
      const taken = await prisma.profile.findUnique({ where: { name: googleName } });
      if (!taken) {
        return await prisma.profile.update({ where: { email }, data: { name: googleName } });
      }
    }
    return existing;
  }

  const name = googleName || email.split("@")[0];
  try {
    return await prisma.profile.create({ data: { name, email } });
  } catch {
    // Name collision — use email prefix
    return await prisma.profile.create({ data: { name: email.split("@")[0], email } });
  }
}
