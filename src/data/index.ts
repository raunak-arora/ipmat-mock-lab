import type { SeedQuestion } from "./types";
import { quantMcq } from "./quant-mcq";
import { quantShortAnswer } from "./quant-sa";
import { verbal } from "./verbal";
import { lr } from "./lr";

export const allSeedQuestions: SeedQuestion[] = [
  ...quantMcq,
  ...quantShortAnswer,
  ...verbal,
  ...lr,
];

export type { SeedQuestion };
