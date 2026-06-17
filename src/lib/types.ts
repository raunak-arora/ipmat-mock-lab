import type { SectionKey, QType } from "./examConfig";

/** Question shape sent to the exam runner — deliberately omits the answer key. */
export interface RunnerQuestion {
  id: string;
  order: number;
  section: SectionKey;
  type: QType;
  topic: string;
  stem: string;
  passage: string | null;
  options: string[] | null;
}

export interface SavedAnswer {
  questionId: string;
  given: string | null;
  status: string;
  timeSpentSec: number;
  bookmarked?: boolean;
}
