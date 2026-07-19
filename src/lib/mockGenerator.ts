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
 * the same passage scattered across the section.
 *
 * When `titaTarget > 0` (CAT mixed sections), the pick also honours the
 * section's type quota: exactly `count - titaTarget` MCQ and `titaTarget`
 * SHORT_ANSWER where the pool allows. Most CAT sets mix both types, so the
 * quota is enforced against each unit's composition — a unit is only accepted
 * if it fits BOTH remaining type budgets, which also guarantees no unit is
 * ever truncated to fit the section. Falls back gracefully (reported upstream
 * as a shortfall) when the pool can't satisfy the targets.
 */
function pickWithTopicSpread(pool: Question[], count: number, titaTarget = 0): Question[] {
  type Unit = { topic: string; questions: Question[]; mcq: number; tita: number };

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
  const toUnit = (qs: Question[]): Unit => ({
    topic: qs[0].topic,
    questions: qs,
    mcq: qs.filter((q) => q.type === "MCQ").length,
    tita: qs.filter((q) => q.type === "SHORT_ANSWER").length,
  });
  const units: Unit[] = [
    ...[...bySet.values()].map(toUnit),
    ...loose.map((q) => toUnit([q])),
  ];

  const byTopic = new Map<string, Unit[]>();
  for (const u of shuffle(units)) {
    const list = byTopic.get(u.topic) ?? [];
    list.push(u);
    byTopic.set(u.topic, list);
  }
  const buckets = shuffle([...byTopic.values()]);

  const quotaOn = titaTarget > 0;
  const mcqTarget = count - titaTarget;
  const picked: Question[] = [];
  let mcqSoFar = 0;
  let titaSoFar = 0;

  const fits = (u: Unit) =>
    picked.length + u.questions.length <= count &&
    (!quotaOn ||
      (mcqSoFar + u.mcq <= mcqTarget && titaSoFar + u.tita <= titaTarget));

  let progress = true;
  while (picked.length < count && progress) {
    progress = false;
    for (const bucket of buckets) {
      const idx = bucket.findIndex(fits);
      if (idx === -1) continue;
      const [unit] = bucket.splice(idx, 1);
      picked.push(...unit.questions);
      mcqSoFar += unit.mcq;
      titaSoFar += unit.tita;
      progress = true;
      if (picked.length >= count) break;
    }
  }
  return picked;
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
    // the pool spans both types; pickWithTopicSpread keeps each caselet's
    // questions contiguous AND enforces the section's MCQ/TITA quota against
    // each set's composition.
    const titaCount = section.titaCount ?? 0;

    if (titaCount > 0) {
      const pool = await prisma.question.findMany({ where: { subject: section.subject, ...topicFilter } });
      if (pool.length === 0) continue;

      // In TOPIC mode `want` shrinks below the full section count; scale the
      // TITA quota proportionally so a 10-question drill isn't forced to the
      // full section's absolute TITA count.
      const titaTarget = Math.min(
        Math.round((titaCount / section.count) * want),
        want
      );
      const combined = pickWithTopicSpread(pool, want, titaTarget);
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
