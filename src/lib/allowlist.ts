import { prisma } from "@/lib/db";
import type { Exam } from "@/lib/examConfig";

export async function isStudentAllowed(email: string): Promise<boolean> {
  const entry = await prisma.allowedStudent.findUnique({ where: { email } });
  return !!entry;
}

/** Returns the exams this student is allowed to access. Empty array = not allowed. */
export async function getStudentAllowedExams(email: string): Promise<Exam[]> {
  const entry = await prisma.allowedStudent.findUnique({ where: { email } });
  if (!entry) return [];
  try {
    const parsed = JSON.parse(entry.allowedExams);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Exam[];
  } catch {
    // malformed JSON — fall back to IPMAT default
  }
  return ["INDORE", "ROHTAK"];
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
