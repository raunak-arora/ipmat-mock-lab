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
 * by one topic. Falls back gracefully when the pool is smaller than `count`.
 */
function pickWithTopicSpread(pool: Question[], count: number): Question[] {
  const byTopic = new Map<string, Question[]>();
  for (const q of shuffle(pool)) {
    const list = byTopic.get(q.topic) ?? [];
    list.push(q);
    byTopic.set(q.topic, list);
  }
  const buckets = shuffle([...byTopic.values()]);
  const picked: Question[] = [];
  let progress = true;
  while (picked.length < count && progress) {
    progress = false;
    for (const bucket of buckets) {
      if (bucket.length === 0) continue;
      picked.push(bucket.shift()!);
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

    // CAT sections have a mixed MCQ + TITA (SHORT_ANSWER) quota.
    const titaCount = section.titaCount ?? 0;
    const mcqCount = want - titaCount;

    if (titaCount > 0) {
      // Pull MCQ and SHORT_ANSWER pools separately, then interleave.
      const [mcqPool, titaPool] = await Promise.all([
        prisma.question.findMany({ where: { subject: section.subject, type: "MCQ", ...topicFilter } }),
        prisma.question.findMany({ where: { subject: section.subject, type: "SHORT_ANSWER", ...topicFilter } }),
      ]);

      if (mcqPool.length === 0 && titaPool.length === 0) continue;

      const pickedMcq = pickWithTopicSpread(mcqPool, mcqCount);
      const pickedTita = pickWithTopicSpread(titaPool, titaCount);

      const combined = shuffle([...pickedMcq, ...pickedTita]);
      const shortfall = combined.length < want;
      if (shortfall) shortfalls.push({ section: section.key, got: combined.length, want });

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
