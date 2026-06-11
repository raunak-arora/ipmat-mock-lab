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
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .replace(/^rs\.?\s*/i, "")
    .replace(/%$/, "");
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
    const gNum = Number(g);
    return candidates.some((c) => {
      const n = normalize(c);
      if (n === g) return true;
      const cNum = Number(n);
      if (!Number.isNaN(cNum) && !Number.isNaN(gNum)) {
        return Math.abs(cNum - gNum) < 1e-6;
      }
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

  const sectionScores: Record<string, SectionScore> = {};
  for (const section of config.sections) {
    sectionScores[section.key] = {
      section: section.key,
      score: 0,
      max: section.count * section.marksCorrect,
      correct: 0,
      wrong: 0,
      skipped: 0,
      total: section.count,
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

  return {
    result: {
      rawScore,
      maxScore: config.totalMarks,
      sectionScores,
      clearedAllCutoffs,
      correct,
      wrong,
      skipped,
    },
    graded,
  };
}
