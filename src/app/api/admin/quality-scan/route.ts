import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, ADMIN_EMAIL } from "@/auth";

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function stripTags(s: string) {
  return s
    .replace(/\[ipmat\s+\w+\s+\d{4}\]\s*/gi, "")
    .replace(/\(ipmat\s+\w+\s+\d{4}\)\s*/gi, "")
    .trim();
}

type IssueType =
  | "answer_not_in_options"
  | "too_few_options"
  | "duplicate_options"
  | "answer_echoes_stem"
  | "short_stem"
  | "option_is_label";

interface Issue {
  id: string;
  subject: string;
  type: string;
  topic: string;
  difficulty: string;
  stem: string;
  answer: string;
  options: string[] | null;
  issueType: IssueType;
  detail: string;
}

export async function POST(req: Request) {
  void req;
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await prisma.question.findMany({
    select: {
      id: true,
      subject: true,
      type: true,
      topic: true,
      difficulty: true,
      stem: true,
      options: true,
      answer: true,
    },
  });

  const issues: Issue[] = [];

  for (const q of all) {
    const strippedStem = stripTags(q.stem);

    if (strippedStem.length < 15) {
      issues.push({
        id: q.id,
        subject: q.subject,
        type: q.type,
        topic: q.topic,
        difficulty: q.difficulty,
        stem: q.stem,
        answer: q.answer,
        options: q.options ? (JSON.parse(q.options) as string[]) : null,
        issueType: "short_stem",
        detail: `Stem is only ${strippedStem.length} chars after stripping tags`,
      });
      continue;
    }

    if (q.type !== "MCQ") continue;

    const opts: string[] = q.options ? (JSON.parse(q.options) as string[]) : [];

    if (opts.length < 4) {
      issues.push({
        id: q.id,
        subject: q.subject,
        type: q.type,
        topic: q.topic,
        difficulty: q.difficulty,
        stem: q.stem,
        answer: q.answer,
        options: opts,
        issueType: "too_few_options",
        detail: `Only ${opts.length} option${opts.length !== 1 ? "s" : ""} found`,
      });
      continue;
    }

    const labelRe = /^[A-D]$/;
    const labelOpt = opts.find((o) => labelRe.test(o.trim()));
    if (labelOpt) {
      issues.push({
        id: q.id,
        subject: q.subject,
        type: q.type,
        topic: q.topic,
        difficulty: q.difficulty,
        stem: q.stem,
        answer: q.answer,
        options: opts,
        issueType: "option_is_label",
        detail: `Option "${labelOpt}" looks like a label, not text`,
      });
      continue;
    }

    const normedOpts = opts.map(norm);
    const seen = new Set<string>();
    let dupFound: string | null = null;
    for (const no of normedOpts) {
      if (seen.has(no)) {
        dupFound = no;
        break;
      }
      seen.add(no);
    }
    if (dupFound) {
      issues.push({
        id: q.id,
        subject: q.subject,
        type: q.type,
        topic: q.topic,
        difficulty: q.difficulty,
        stem: q.stem,
        answer: q.answer,
        options: opts,
        issueType: "duplicate_options",
        detail: `Duplicate option: "${dupFound}"`,
      });
      continue;
    }

    let candidates: string[];
    try {
      const parsed = JSON.parse(q.answer);
      candidates = Array.isArray(parsed) ? (parsed as string[]) : [q.answer];
    } catch {
      candidates = [q.answer];
    }

    const answerMatchesOption = candidates.some((cand) =>
      normedOpts.some((no) => no === norm(cand))
    );

    if (!answerMatchesOption) {
      issues.push({
        id: q.id,
        subject: q.subject,
        type: q.type,
        topic: q.topic,
        difficulty: q.difficulty,
        stem: q.stem,
        answer: q.answer,
        options: opts,
        issueType: "answer_not_in_options",
        detail: `Answer "${q.answer}" not found among options`,
      });
      continue;
    }

    if (q.topic === "Verbal Analogies") {
      const correctOpt = opts.find((o) =>
        candidates.some((cand) => norm(o) === norm(cand))
      );
      if (correctOpt) {
        const stemWords = strippedStem
          .toLowerCase()
          .split(/\W+/)
          .filter((w) => w.length > 4);
        const optLower = correctOpt.toLowerCase();
        const echoWord = stemWords.find((w) => optLower.includes(w));
        if (echoWord) {
          issues.push({
            id: q.id,
            subject: q.subject,
            type: q.type,
            topic: q.topic,
            difficulty: q.difficulty,
            stem: q.stem,
            answer: q.answer,
            options: opts,
            issueType: "answer_echoes_stem",
            detail: `Option contains stem word: ${echoWord}`,
          });
        }
      }
    }
  }

  return NextResponse.json({
    total: all.length,
    issueCount: issues.length,
    issues,
  });
}
