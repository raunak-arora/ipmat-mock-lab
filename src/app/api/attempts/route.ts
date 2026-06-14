import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, ADMIN_EMAIL } from "@/auth";
import { generateMock } from "@/lib/mockGenerator";
import { Exam, Mode, SectionKey } from "@/lib/examConfig";

// Create a new attempt: generate a mock from the bank and persist its
// question set as ordered AttemptAnswer rows.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const exam = body.exam as Exam;
  const mode = (body.mode as Mode) ?? "FULL";
  const scopeSection = body.scopeSection as SectionKey | undefined;
  const scopeTopic = body.scopeTopic as string | undefined;

  const profileId: string | undefined = body.profileId;
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  // Students may only create attempts for their own profile.
  if (session.user.email !== ADMIN_EMAIL) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile || profile.email !== session.user.email)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (exam !== "INDORE" && exam !== "ROHTAK") {
    return NextResponse.json({ error: "Invalid exam" }, { status: 400 });
  }

  const { planned, shortfalls } = await generateMock({
    exam,
    mode,
    scopeSection,
    scopeTopic,
  });

  if (planned.length === 0) {
    return NextResponse.json(
      { error: "No questions available for this selection." },
      { status: 422 }
    );
  }

  const attempt = await prisma.attempt.create({
    data: {
      profileId,
      exam,
      mode,
      scopeSection: scopeSection ?? null,
      scopeTopic: scopeTopic ?? null,
      answers: {
        create: planned.map((p) => ({
          questionId: p.question.id,
          section: p.section,
          order: p.order,
          status: "unseen",
        })),
      },
    },
  });

  return NextResponse.json({ attemptId: attempt.id, shortfalls });
}
