// Single source of truth for IPMAT and CAT exam patterns. The runner, scorer,
// mock generator and percentile estimator all read from here.

export type Exam = "INDORE" | "ROHTAK" | "CAT";
export type ExamFamily = "IPMAT" | "CAT";
export type SectionKey = "QA_SA" | "QA_MCQ" | "VA" | "LR" | "QA" | "CAT_VARC" | "CAT_DILR" | "CAT_QA";
export type Subject = "QUANT" | "VERBAL" | "LR" | "CAT_VARC" | "CAT_DILR" | "CAT_QA";
export type QType = "MCQ" | "SHORT_ANSWER";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type Mode = "FULL" | "SECTIONAL" | "TOPIC";

export interface SectionConfig {
  key: SectionKey;
  label: string;
  short: string;
  /** Which question-bank subject pool this section draws from. */
  subject: Subject;
  /** Primary question type. For CAT mixed sections this is "MCQ"; titaCount gives the SHORT_ANSWER quota. */
  type: QType;
  count: number;
  marksCorrect: number;
  /** Penalty per wrong MCQ answer; SHORT_ANSWER questions always get 0 penalty regardless. */
  marksWrong: number;
  /** Per-section time limit in minutes, or null when there is no sectional lock. */
  timeLimitMin: number | null;
  /** Public sectional cut-off (raw marks) used for the "cleared cutoff" verdict. */
  sectionalCutoff: number;
  /** Topics this section draws from, used by the mock generator's blueprint. */
  topics: string[];
  /** CAT: number of TITA (SHORT_ANSWER) questions within this otherwise-MCQ section. */
  titaCount?: number;
}

export interface ExamConfig {
  key: Exam;
  label: string;
  conductedBy: string;
  totalQuestions: number;
  totalMarks: number;
  durationMin: number;
  sectionalTiming: boolean;
  sections: SectionConfig[];
  goodScore: { score: number; percentile: number };
  notes: string[];
}

export function getExamFamily(exam: Exam): ExamFamily {
  return exam === "CAT" ? "CAT" : "IPMAT";
}

// ── Topic vocabularies ──────────────────────────────────────────────────────

export const QA_TOPICS = [
  "Number System",
  "Algebra",
  "Arithmetic",
  "Geometry & Mensuration",
  "Coordinate Geometry",
  "Trigonometry",
  "Modern Maths",
  "Statistics",
  "Data Interpretation",
  "Logarithms & Surds",
  "Functions & Progressions",
  "Probability",
  "Permutation and Combination",
  "Time Speed Distance",
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
  "Fill in the Blanks",
  "Critical Reasoning",
  "One-word Substitution",
  "Sentence Completion",
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
  "Analogies",
  "Data Interpretation",
  "Data Sufficiency",
  "Input-Output",
] as const;

// CAT-specific topic lists
export const CAT_VARC_TOPICS = [
  "Reading Comprehension",
  "Para Summary",
  "Para Completion",
  "Odd One Out",
  "Critical Reasoning",
] as const;

export const CAT_DILR_TOPICS = [
  "Data Tables",
  "Bar Graphs",
  "Line Graphs",
  "Pie Charts",
  "Caselets",
  "Venn Diagrams",
  "Seating Arrangements",
  "Grid & Matrix Puzzles",
  "Scheduling & Sequencing",
  "Games & Tournaments",
  "Routes & Networks",
  "Binary Logic",
] as const;

export const CAT_QA_TOPICS = [
  "Number System",
  "Algebra",
  "Arithmetic",
  "Geometry & Mensuration",
  "Coordinate Geometry",
  "Trigonometry",
  "Functions & Progressions",
  "Logarithms & Surds",
  "Permutation and Combination",
  "Probability",
  "Modern Maths",
] as const;

// ── Exam definitions ─────────────────────────────────────────────────────────

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
        marksWrong: 0,
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
  CAT: {
    key: "CAT",
    label: "CAT",
    conductedBy: "IIMs",
    totalQuestions: 68,
    totalMarks: 204,
    durationMin: 120,
    sectionalTiming: true,
    goodScore: { score: 96, percentile: 99 },
    sections: [
      {
        key: "CAT_VARC",
        label: "Verbal Ability & Reading Comprehension",
        short: "VARC",
        subject: "CAT_VARC",
        type: "MCQ",
        count: 24,
        marksCorrect: 3,
        marksWrong: -1,
        timeLimitMin: 40,
        sectionalCutoff: 18, // ~70th percentile IIM minimum qualifying
        topics: [...CAT_VARC_TOPICS],
        titaCount: 2, // 22 MCQ + 2 TITA (Odd One Out)
      },
      {
        key: "CAT_DILR",
        label: "Data Interpretation & Logical Reasoning",
        short: "DILR",
        subject: "CAT_DILR",
        type: "MCQ",
        count: 22,
        marksCorrect: 3,
        marksWrong: -1,
        timeLimitMin: 40,
        sectionalCutoff: 14,
        topics: [...CAT_DILR_TOPICS],
        titaCount: 10, // 12 MCQ + 10 TITA
      },
      {
        key: "CAT_QA",
        label: "Quantitative Aptitude",
        short: "QA",
        subject: "CAT_QA",
        type: "MCQ",
        count: 22,
        marksCorrect: 3,
        marksWrong: -1,
        timeLimitMin: 40,
        sectionalCutoff: 14,
        topics: [...CAT_QA_TOPICS],
        titaCount: 8, // 14 MCQ + 8 TITA
      },
    ],
    notes: [
      "Each section is locked behind a 40-minute timer — you cannot switch sections once time expires.",
      "MCQ questions carry −1 penalty per wrong answer; TITA (type-in) questions have NO negative marking.",
      "Percentiles are scaled across all test slots. You need 99+ overall for IIM A/B/C shortlisting.",
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
  CAT_VARC: "VARC",
  CAT_DILR: "DILR",
  CAT_QA: "Quantitative Aptitude",
};

export const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

/**
 * Score → percentile anchor points per exam.
 * IPMAT anchors: calibrated from public IIM Indore/Rohtak cut-off disclosures.
 * CAT anchors: calibrated from CAT 2024 official score-card data (IMS India / cracku).
 * All are ESTIMATES, not official data.
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
  // CAT 2024 data (68Q, max 204). Score here = scaled/normalised score.
  CAT: [
    { score: 0, percentile: 1 },
    { score: 10, percentile: 10 },
    { score: 20, percentile: 30 },
    { score: 30, percentile: 50 },
    { score: 43, percentile: 80 },
    { score: 49, percentile: 85 },
    { score: 57, percentile: 90 },
    { score: 70, percentile: 95 },
    { score: 85, percentile: 98 },
    { score: 96, percentile: 99 },
    { score: 115, percentile: 99.5 },
    { score: 204, percentile: 99.99 },
  ],
};
