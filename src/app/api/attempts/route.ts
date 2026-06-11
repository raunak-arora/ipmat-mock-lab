import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateMock } from "@/lib/mockGenerator";
import { Exam, Mode, SectionKey } from "@/lib/examConfig";

// Create a new attempt: generate a mock from the bank and persist its
// question set as ordered AttemptAnswer rows.
export async function POST(req: Request) {
  const body = await req.json();
  const exam = body.exam as Exam;
  const mode = (body.mode as Mode) ?? "FULL";
  const scopeSection = body.scopeSection as SectionKey | undefined;
  const scopeTopic = body.scopeTopic as string | undefined;

  let profileId: string | undefined = body.profileId;
  if (!profileId && body.profileName) {
    const profile = await prisma.profile.upsert({
      where: { name: String(body.profileName).trim() },
      update: {},
      create: { name: String(body.profileName).trim() },
    });
    profileId = profile.id;
  }
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
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
