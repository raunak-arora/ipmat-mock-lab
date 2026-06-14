// Single source of truth for IPMAT exam patterns. The runner, scorer, mock
// generator and percentile estimator all read from here. Data is sourced from
// the public 2025/2026 exam patterns and cutoff disclosures (see README).

export type Exam = "INDORE" | "ROHTAK";
export type SectionKey = "QA_SA" | "QA_MCQ" | "VA" | "LR" | "QA";
export type Subject = "QUANT" | "VERBAL" | "LR";
export type QType = "MCQ" | "SHORT_ANSWER";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type Mode = "FULL" | "SECTIONAL" | "TOPIC";

export interface SectionConfig {
  key: SectionKey;
  label: string;
  short: string;
  /** Which question-bank subject pool this section draws from. */
  subject: Subject;
  type: QType;
  count: number;
  marksCorrect: number;
  marksWrong: number; // 0 means no negative marking
  /** Per-section time limit in minutes, or null when there is no sectional lock. */
  timeLimitMin: number | null;
  /** Public sectional cut-off (raw marks) used for the "cleared cutoff" verdict. */
  sectionalCutoff: number;
  /** Topics this section draws from, used by the mock generator's blueprint. */
  topics: string[];
}

export interface ExamConfig {
  key: Exam;
  label: string;
  conductedBy: string;
  totalQuestions: number;
  totalMarks: number;
  durationMin: number;
  /** When true, sections are locked behind their own timers (IIM Indore). */
  sectionalTiming: boolean;
  sections: SectionConfig[];
  /** A representative "good score" and the percentile it maps to. */
  goodScore: { score: number; percentile: number };
  notes: string[];
}

// Topic vocabularies (also the allowed `topic` values for the question bank).
export const QA_TOPICS = [
  "Number System",
  "Algebra",
  "Arithmetic",
  "Geometry & Mensuration",
  "Modern Maths",
  "Statistics",
  "Data Interpretation",
  "Logarithms & Surds",
  "Functions & Progressions",
] as const;

export const VA_TOPICS = [
  "Reading Comprehension",
  "Vocabulary",
  "Grammar",
  "Para Jumbles",
  "Sentence Correction",
  "Idioms & Phrases",
  "Para Completion",
  "Verbal Analogies",
] as const;

export const LR_TOPICS = [
  "Arrangements & Seating",
  "Blood Relations",
  "Syllogisms",
  "Coding-Decoding",
  "Series & Patterns",
  "Puzzles",
  "Directions & Distances",
  "Clocks & Calendars",
  "Statement Reasoning",
  "Venn Diagrams",
] as const;

export const EXAMS: Record<Exam, ExamConfig> = {
  INDORE: {
    key: "INDORE",
    label: "IPMAT Indore",
    conductedBy: "IIM Indore",
    totalQuestions: 90,
    totalMarks: 360,
    durationMin: 120,
    sectionalTiming: true,
    goodScore: { score: 164, percentile: 95 },
    sections: [
      {
        key: "QA_SA",
        label: "Quantitative Ability (Short Answer)",
        short: "QA-SA",
        subject: "QUANT",
        type: "SHORT_ANSWER",
        count: 15,
        marksCorrect: 4,
        marksWrong: 0, // no negative marking on the type-the-answer section
        timeLimitMin: 40,
        sectionalCutoff: 24,
        topics: [...QA_TOPICS],
      },
      {
        key: "QA_MCQ",
        label: "Quantitative Ability (MCQ)",
        short: "QA-MCQ",
        subject: "QUANT",
        type: "MCQ",
        count: 30,
        marksCorrect: 4,
        marksWrong: -1,
        timeLimitMin: 40,
        sectionalCutoff: 28,
        topics: [...QA_TOPICS],
      },
      {
        key: "VA",
        label: "Verbal Ability",
        short: "VA",
        subject: "VERBAL",
        type: "MCQ",
        count: 45,
        marksCorrect: 4,
        marksWrong: -1,
        timeLimitMin: 40,
        sectionalCutoff: 112,
        topics: [...VA_TOPICS],
      },
    ],
    notes: [
      "Each section is locked behind a 40-minute timer — you cannot return to a finished section.",
      "QA (Short Answer) has NO negative marking; the two MCQ sections deduct 1 mark per wrong answer.",
      "You must clear EVERY sectional cut-off to be shortlisted, regardless of total score.",
    ],
  },
  ROHTAK: {
    key: "ROHTAK",
    label: "IPMAT Rohtak",
    conductedBy: "IIM Rohtak",
    totalQuestions: 120,
    totalMarks: 480,
    durationMin: 120,
    sectionalTiming: false,
    goodScore: { score: 320, percentile: 95 },
    sections: [
      {
        key: "QA",
        label: "Quantitative Ability",
        short: "QA",
        subject: "QUANT",
        type: "MCQ",
        count: 40,
        marksCorrect: 4,
        marksWrong: -1,
        timeLimitMin: null,
        sectionalCutoff: 40,
        topics: [...QA_TOPICS],
      },
      {
        key: "LR",
        label: "Logical Reasoning",
        short: "LR",
        subject: "LR",
        type: "MCQ",
        count: 40,
        marksCorrect: 4,
        marksWrong: -1,
        timeLimitMin: null,
        sectionalCutoff: 40,
        topics: [...LR_TOPICS],
      },
      {
        key: "VA",
        label: "Verbal Ability",
        short: "VA",
        subject: "VERBAL",
        type: "MCQ",
        count: 40,
        marksCorrect: 4,
        marksWrong: -1,
        timeLimitMin: null,
        sectionalCutoff: 40,
        topics: [...VA_TOPICS],
      },
    ],
    notes: [
      "No sectional timer — you may move freely across all three sections for the full 120 minutes.",
      "Every section carries negative marking: −1 per wrong answer.",
      "Selection is primarily on overall merit; sectional cut-offs are modest.",
    ],
  },
};

export function getExam(exam: Exam): ExamConfig {
  return EXAMS[exam];
}

export function getSection(exam: Exam, key: SectionKey): SectionConfig {
  const section = EXAMS[exam].sections.find((s) => s.key === key);
  if (!section) throw new Error(`Unknown section ${key} for exam ${exam}`);
  return section;
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  QA_SA: "QA (Short Answer)",
  QA_MCQ: "QA (MCQ)",
  QA: "Quantitative Ability",
  LR: "Logical Reasoning",
  VA: "Verbal Ability",
};

export const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

/**
 * Score → percentile anchor points per exam. The curve is piecewise-linear
 * between anchors. These are ESTIMATES calibrated from public cut-off
 * disclosures (e.g. Indore ~164/360 ≈ 95th, ~185 ≈ 99th), NOT official data.
 */
export const PERCENTILE_ANCHORS: Record<Exam, Array<{ score: number; percentile: number }>> = {
  INDORE: [
    { score: 0, percentile: 1 },
    { score: 40, percentile: 25 },
    { score: 70, percentile: 45 },
    { score: 100, percentile: 62 },
    { score: 130, percentile: 80 },
    { score: 150, percentile: 90 },
    { score: 164, percentile: 95 },
    { score: 175, percentile: 97.5 },
    { score: 185, percentile: 99 },
    { score: 210, percentile: 99.7 },
    { score: 360, percentile: 99.99 },
  ],
  ROHTAK: [
    { score: 0, percentile: 1 },
    { score: 60, percentile: 25 },
    { score: 120, percentile: 45 },
    { score: 180, percentile: 62 },
    { score: 240, percentile: 80 },
    { score: 280, percentile: 90 },
    { score: 320, percentile: 95 },
    { score: 360, percentile: 97.5 },
    { score: 400, percentile: 99 },
    { score: 440, percentile: 99.7 },
    { score: 480, percentile: 99.99 },
  ],
};
