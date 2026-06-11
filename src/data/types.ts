import type { Difficulty, QType, Subject } from "@/lib/examConfig";

/** Shape of a question in the seed bank / bulk-import format. */
export interface SeedQuestion {
  subject: Subject;
  type: QType;
  topic: string;
  subTopic?: string;
  difficulty: Difficulty;
  /** For MCQ this is the prompt; for RC it's the question about the passage. */
  stem: string;
  /** Optional shared reading passage (RC). */
  passage?: string;
  /** Options for MCQ (omit for SHORT_ANSWER). */
  options?: string[];
  /**
   * MCQ: the exact correct option text.
   * SHORT_ANSWER: the accepted answer; use a JSON array string like
   * '["0.5","1/2"]' to accept multiple forms.
   */
  answer: string;
  explanation?: string;
  tags?: string[];
}
