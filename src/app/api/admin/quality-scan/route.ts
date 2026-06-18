import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/is-admin";

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
  | "option_is_label"
  | "missing_explanation"
  | "explanation_contradicts_answer";

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

// Increase Vercel function timeout (respected on Pro; harmless on Hobby).
export const maxDuration = 60;

export async function POST(req: Request) {
  void req;
  const session = await auth();
  if (!await isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Mark any previously stuck RUNNING audit jobs as timed out so the UI clears.
  await prisma.adminJob.updateMany({
    where: { type: "AUDIT", status: "RUNNING" },
    data: { status: "ERROR", finishedAt: new Date(), result: JSON.stringify({ error: "Timed out — previous run exceeded the serverless function limit." }) },
  });

  const job = await prisma.adminJob.create({ data: { type: "AUDIT" } });

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
      explanation: true,
    },
  });

  const issues: Issue[] = [];

  for (const q of all) {
    const strippedStem = stripTags(q.stem);

    // Explanation contradicts stored answer — highest priority, runs first.
    if (q.explanation) {
      const expLower = q.explanation.toLowerCase();

      // Signal 1: explicit self-correction markers in the explanation text.
      const hasCorrectionMarker =
        /\bcorrection\s*:/i.test(q.explanation) ||
        /\bwait\s*[—–-]/i.test(q.explanation) ||
        /\bshould\s+be\b/i.test(q.explanation) ||
        /\bactually\s+(?:the\s+)?(?:correct\s+)?answer\b/i.test(q.explanation);

      // Signal 2: for SHORT_ANSWER, extract the final stated numeric answer and
      // compare it to the stored answer (catches "so answer = 3" vs stored "7").
      let numericMismatch: string | null = null;
      if (q.type === "SHORT_ANSWER") {
        const m = expLower.match(
          /(?:(?:unit\s+digit|answer)\s+(?:is|=)\s*|=\s*)(\d+(?:\.\d+)?)\s*\.?\s*$/
        );
        if (m) {
          const stated = m[1];
          const stored = q.answer.trim().toLowerCase();
          if (stated !== stored) numericMismatch = stated;
        }
      }

      // Signal 3: for MCQ, if explanation explicitly names a different answer.
      let mcqMismatch: string | null = null;
      if (q.type === "MCQ") {
        const m = expLower.match(
          /(?:correction[:\s]+answer\s+is\s*|correct\s+answer\s+is\s*)(\d+(?:\.\d+)?|\w+)/
        );
        if (m) {
          const stated = m[1].trim();
          if (norm(stated) !== norm(q.answer)) mcqMismatch = stated;
        }
      }

      if (hasCorrectionMarker || numericMismatch || mcqMismatch) {
        const detail = numericMismatch
          ? `Explanation says answer is ${numericMismatch} but stored answer is "${q.answer}"`
          : mcqMismatch
          ? `Explanation says answer is "${mcqMismatch}" but stored answer is "${q.answer}"`
          : `Explanation contains a self-correction marker — stored answer "${q.answer}" may be wrong`;
        issues.push({
          id: q.id,
          subject: q.subject,
          type: q.type,
          topic: q.topic,
          difficulty: q.difficulty,
          stem: q.stem,
          answer: q.answer,
          options: q.options ? (JSON.parse(q.options) as string[]) : null,
          issueType: "explanation_contradicts_answer",
          detail,
        });
      }
    }

    // Missing explanation — warning, doesn't block other checks.
    if (!q.explanation || q.explanation.trim() === "") {
      issues.push({
        id: q.id,
        subject: q.subject,
        type: q.type,
        topic: q.topic,
        difficulty: q.difficulty,
        stem: q.stem,
        answer: q.answer,
        options: q.options ? (JSON.parse(q.options) as string[]) : null,
        issueType: "missing_explanation",
        detail: "No explanation provided — students can't learn from this question",
      });
    }

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

  const payload = { total: all.length, issueCount: issues.length, issues };
  await prisma.adminJob.update({
    where: { id: job.id },
    data: {
      status: "DONE",
      finishedAt: new Date(),
      result: JSON.stringify(payload),
    },
  });
  return NextResponse.json(payload);
}
