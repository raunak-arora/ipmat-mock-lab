import { prisma } from "./db";
import {
  Exam,
  Mode,
  SectionKey,
  getExam,
  getSection,
} from "./examConfig";
import type { Question } from "@/generated/prisma";

export interface PlannedQuestion {
  question: Question;
  section: SectionKey;
  order: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick `count` questions from a pool, spread as evenly as possible across the
 * distinct topics present (round-robin), so a generated section isn't dominated
 * by one topic. Questions that share a `setId` (a DILR caselet or an RC
 * passage generating several linked questions) are treated as one indivisible
 * unit — picked and kept contiguous together — so a student never re-reads
 * the same passage scattered across the section. Falls back gracefully when
 * the pool is smaller than `count`.
 */
function pickWithTopicSpread(pool: Question[], count: number): Question[] {
  type Unit = { topic: string; questions: Question[] };

  const bySet = new Map<string, Question[]>();
  const loose: Question[] = [];
  for (const q of pool) {
    if (q.setId) {
      const list = bySet.get(q.setId) ?? [];
      list.push(q);
      bySet.set(q.setId, list);
    } else {
      loose.push(q);
    }
  }
  const units: Unit[] = [
    ...[...bySet.values()].map((qs) => ({ topic: qs[0].topic, questions: qs })),
    ...loose.map((q) => ({ topic: q.topic, questions: [q] })),
  ];

  const byTopic = new Map<string, Unit[]>();
  for (const u of shuffle(units)) {
    const list = byTopic.get(u.topic) ?? [];
    list.push(u);
    byTopic.set(u.topic, list);
  }
  const buckets = shuffle([...byTopic.values()]);

  const picked: Question[] = [];
  let progress = true;
  while (picked.length < count && progress) {
    progress = false;
    for (const bucket of buckets) {
      if (bucket.length === 0) continue;
      const unit = bucket.shift()!;
      picked.push(...unit.questions);
      progress = true;
      if (picked.length >= count) break;
    }
  }
  // A picked unit can overshoot the target by a question or two (real DILR
  // sets vary in size too); trim to the exact count so section totals hold.
  return picked.slice(0, count);
}

export interface GenerateOptions {
  exam: Exam;
  mode: Mode;
  scopeSection?: SectionKey;
  scopeTopic?: string;
  /** Multiple topics for weak-topic drill — overrides scopeTopic when set. */
  scopeTopics?: string[];
  /** Questions per section for TOPIC practice mode. */
  practiceSize?: number;
}

export interface GeneratedMock {
  planned: PlannedQuestion[];
  /** Sections that came up short of the target count, for an honest warning. */
  shortfalls: Array<{ section: SectionKey; got: number; want: number }>;
}

export async function generateMock(
  opts: GenerateOptions
): Promise<GeneratedMock> {
  const config = getExam(opts.exam);
  const planned: PlannedQuestion[] = [];
  const shortfalls: GeneratedMock["shortfalls"] = [];
  let order = 0;

  const isWeakDrill = opts.scopeTopics && opts.scopeTopics.length > 0;

  const targetSections =
    opts.mode === "FULL"
      ? config.sections
      : isWeakDrill
        ? config.sections  // all sections — empty pools get skipped below
        : config.sections.filter((s) => s.key === opts.scopeSection);

  for (const section of targetSections) {
    const want =
      opts.mode === "TOPIC"
        ? opts.practiceSize ?? 15
        : section.count;

    const topicFilter = isWeakDrill
      ? { topic: { in: opts.scopeTopics! } }
      : opts.mode === "TOPIC" && opts.scopeTopic
        ? { topic: opts.scopeTopic }
        : {};

    // CAT sections mix MCQ + TITA (SHORT_ANSWER) within the same caselets, so
    // the pool spans both types and pickWithTopicSpread's set-awareness keeps
    // each caselet's questions (of whichever types) contiguous. The section's
    // titaCount is a target ratio, not a hard split — real DILR/VARC sets mix
    // MCQ and TITA in whatever proportion the caselet itself has.
    const titaCount = section.titaCount ?? 0;

    if (titaCount > 0) {
      const pool = await prisma.question.findMany({ where: { subject: section.subject, ...topicFilter } });
      if (pool.length === 0) continue;

      const combined = pickWithTopicSpread(pool, want);
      if (combined.length < want) shortfalls.push({ section: section.key, got: combined.length, want });

      for (const q of combined) {
        planned.push({ question: q, section: section.key, order: order++ });
      }
    } else {
      // Pure MCQ or pure SHORT_ANSWER section (all IPMAT sections).
      const pool = await prisma.question.findMany({
        where: { subject: section.subject, type: section.type, ...topicFilter },
      });

      if (pool.length === 0) continue;

      const picked = pickWithTopicSpread(pool, want);
      if (picked.length < want) {
        shortfalls.push({ section: section.key, got: picked.length, want });
      }
      for (const q of picked) {
        planned.push({ question: q, section: section.key, order: order++ });
      }
    }
  }

  return { planned, shortfalls };
}

/** Estimate, before generating, how many questions are available per section. */
export async function countAvailability(exam: Exam) {
  const config = getExam(exam);
  const result: Array<{
    section: SectionKey;
    available: number;
    needed: number;
  }> = [];
  for (const section of config.sections) {
    const titaCount = section.titaCount ?? 0;
    let available: number;
    if (titaCount > 0) {
      const [mcq, tita] = await Promise.all([
        prisma.question.count({ where: { subject: section.subject, type: "MCQ" } }),
        prisma.question.count({ where: { subject: section.subject, type: "SHORT_ANSWER" } }),
      ]);
      available = mcq + tita;
    } else {
      available = await prisma.question.count({
        where: { subject: section.subject, type: section.type },
      });
    }
    result.push({ section: section.key, available, needed: section.count });
  }
  return result;
}

export { getSection };
