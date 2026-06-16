import {
  Exam,
  SectionKey,
  getExam,
  getSection,
} from "./examConfig";

/** Minimal shape of a question needed to grade it. */
export interface GradableQuestion {
  id: string;
  section: SectionKey;
  type: "MCQ" | "SHORT_ANSWER";
  /** MCQ: correct option text. SHORT_ANSWER: JSON array of acceptable answers. */
  answer: string;
}

export interface SubmittedAnswer {
  questionId: string;
  given: string | null;
  timeSpentSec?: number;
}

export interface GradedAnswer {
  questionId: string;
  section: SectionKey;
  given: string | null;
  isCorrect: boolean | null; // null = not attempted
  marks: number;
  correctAnswer: string;
}

export interface SectionScore {
  section: SectionKey;
  score: number;
  max: number;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  cutoff: number;
  clearedCutoff: boolean;
}

export interface AttemptResult {
  rawScore: number;
  maxScore: number;
  sectionScores: Record<string, SectionScore>;
  clearedAllCutoffs: boolean;
  correct: number;
  wrong: number;
  skipped: number;
}

/** Normalise a free-text / numeric answer for comparison. */
function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^rs\.?\s*/i, "")   // strip Rs. / Rs prefix
    .replace(/,/g, "")           // remove thousands separators
    .replace(/\s+/g, "")         // strip all whitespace (handles "9 : 10")
    .replace(/%$/, "")           // strip trailing %
    .replace(/:/g, "/");         // unify ratio notation: 9:10 → 9/10
}

/**
 * Evaluate a simple fraction or integer string to a number.
 * Returns null for anything that can't be reduced to a number (e.g. "3/4/5").
 */
function evalFraction(s: string): number | null {
  const m = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (m) {
    const den = parseFloat(m[2]);
    if (den !== 0) return parseFloat(m[1]) / den;
  }
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function parseAcceptable(answer: string): string[] {
  try {
    const parsed = JSON.parse(answer);
    if (Array.isArray(parsed)) return parsed.map((a) => String(a));
  } catch {
    // Not JSON — treat the whole string as the single acceptable answer.
  }
  return [answer];
}

/** Returns true/false for an attempted answer, or null when not attempted. */
export function checkAnswer(
  question: GradableQuestion,
  given: string | null
): boolean | null {
  if (given == null || given.trim() === "") return null;

  if (question.type === "SHORT_ANSWER") {
    const candidates = parseAcceptable(question.answer);
    const g = normalize(given);
    return candidates.some((c) => {
      const n = normalize(c);
      if (n === g) return true;
      // Numeric / fraction comparison: 9/10 == 0.9 == 9:10 (after normalize)
      const gVal = evalFraction(g);
      const cVal = evalFraction(n);
      if (gVal !== null && cVal !== null) return Math.abs(cVal - gVal) < 1e-6;
      return false;
    });
  }

  // MCQ: exact match against the correct option text.
  return normalize(given) === normalize(question.answer);
}

export function gradeAnswers(
  exam: Exam,
  questions: GradableQuestion[],
  submitted: SubmittedAnswer[]
): GradedAnswer[] {
  const byId = new Map(submitted.map((s) => [s.questionId, s]));
  return questions.map((q) => {
    const given = byId.get(q.id)?.given ?? null;
    const isCorrect = checkAnswer(q, given);
    const section = getSection(exam, q.section);
    let marks = 0;
    if (isCorrect === true) marks = section.marksCorrect;
    else if (isCorrect === false) marks = section.marksWrong;
    return {
      questionId: q.id,
      section: q.section,
      given,
      isCorrect,
      marks,
      correctAnswer: q.answer,
    };
  });
}

export function scoreAttempt(
  exam: Exam,
  questions: GradableQuestion[],
  submitted: SubmittedAnswer[]
): { result: AttemptResult; graded: GradedAnswer[] } {
  const graded = gradeAnswers(exam, questions, submitted);
  const config = getExam(exam);

  // Count actual questions per section in this attempt (handles sectional/topic mocks).
  const questionCountBySection = new Map<string, number>();
  for (const q of questions) {
    questionCountBySection.set(q.section, (questionCountBySection.get(q.section) ?? 0) + 1);
  }

  const sectionScores: Record<string, SectionScore> = {};
  for (const section of config.sections) {
    const count = questionCountBySection.get(section.key);
    if (!count) continue; // section not part of this attempt
    sectionScores[section.key] = {
      section: section.key,
      score: 0,
      max: count * section.marksCorrect,
      correct: 0,
      wrong: 0,
      skipped: 0,
      total: count,
      cutoff: section.sectionalCutoff,
      clearedCutoff: false,
    };
  }

  for (const g of graded) {
    const s = sectionScores[g.section];
    if (!s) continue;
    s.score += g.marks;
    if (g.isCorrect === true) s.correct += 1;
    else if (g.isCorrect === false) s.wrong += 1;
    else s.skipped += 1;
  }

  let rawScore = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let clearedAllCutoffs = true;
  for (const s of Object.values(sectionScores)) {
    s.clearedCutoff = s.score >= s.cutoff;
    if (!s.clearedCutoff) clearedAllCutoffs = false;
    rawScore += s.score;
    correct += s.correct;
    wrong += s.wrong;
    skipped += s.skipped;
  }

  const maxScore = Object.values(sectionScores).reduce((s, ss) => s + ss.max, 0);

  return {
    result: {
      rawScore,
      maxScore,
      sectionScores,
      clearedAllCutoffs,
      correct,
      wrong,
      skipped,
    },
    graded,
  };
}
