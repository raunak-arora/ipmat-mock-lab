/**
 * One-time script to normalize topic names across the question bank.
 * Run with: npx ts-node --project tsconfig.scripts.json scripts/normalize-topics.ts
 * Or via: export $(grep -v '^#' .env | xargs) && node ... (see apply-audit-fixes.ts pattern)
 */

import { PrismaClient } from "../../src/generated/prisma";

const prisma = new PrismaClient();

// Map from old/variant name → canonical name
const QUANT_RENAMES: Record<string, string> = {
  // Geometry consolidation
  "Circles": "Geometry & Mensuration",
  "Geometry": "Geometry & Mensuration",
  "Triangles": "Geometry & Mensuration",
  "Quadrilaterals": "Geometry & Mensuration",
  "Mensuration": "Geometry & Mensuration",
  // Coordinate Geometry dedup
  "Geometry / Coordinate Geometry": "Coordinate Geometry",
  // Logarithms
  "Logarithm": "Logarithms & Surds",
  "Logarithms": "Logarithms & Surds",
  "Algebra / Logarithms": "Logarithms & Surds",
  // Functions & Progressions
  "Arithmetic Progression": "Functions & Progressions",
  "Geometric Progression": "Functions & Progressions",
  "Progressions": "Functions & Progressions",
  "Progressions / Arithmetic Progression": "Functions & Progressions",
  // Number System
  "Number Theory": "Number System",
  "Number System / Divisibility": "Number System",
  // Algebra
  "Algebra / Inequalities": "Algebra",
  "Algebra / Polynomials": "Algebra",
  "Algebra / Binomial Theorem": "Algebra",
  "Algebra / Sequences": "Algebra",
  // Arithmetic — absorb specific sub-topics
  "Arithmetic / Simple & Compound Interest": "Arithmetic",
  "Arithmetic / Work": "Arithmetic",
  "Arithmetic / Mixtures": "Arithmetic",
  "Simple Interest": "Arithmetic",
  "Compound Interest": "Arithmetic",
  "Time and Work": "Arithmetic",
  // Time Speed Distance
  "Time, Speed & Distance": "Time Speed Distance",
  "Time, Speed and Distance": "Time Speed Distance",
  // Modern Maths
  "Sets": "Modern Maths",
  // Permutation and Combination
  "Permutations and Combinations": "Permutation and Combination",
  "Permutation & Combination": "Permutation and Combination",
  "Combinatorics": "Permutation and Combination",
};

const LR_RENAMES: Record<string, string> = {
  "Seating Arrangement": "Arrangements & Seating",
  "Coding Decoding": "Coding-Decoding",
  "Clocks and Calendars": "Clocks & Calendars",
  "Number Series": "Series & Patterns",
  "Letter Series": "Series & Patterns",
  "Directions": "Directions & Distances",
  "Statement and Conclusion": "Statement Reasoning",
  "Logical Deduction": "Statement Reasoning",
};

const VERBAL_RENAMES: Record<string, string> = {
  "Para-jumbles": "Para Jumbles",
  "Idioms and Phrases": "Idioms & Phrases",
  "Idioms": "Idioms & Phrases",
  "Idioms / Phrasal Verbs": "Idioms & Phrases",
  "Sentence Improvement": "Sentence Correction",
  "Grammar / Sentence Correction": "Sentence Correction",
  "Antonyms / Vocabulary": "Vocabulary",
  "Synonym Antonym": "Vocabulary",
  "Word Usage": "Vocabulary",
  "Vocabulary / Analogies": "Verbal Analogies",
  "Analogies": "Verbal Analogies",
  "Error Spotting": "Grammar",
  "Error Detection": "Grammar",
  "Reading Comprehension / Critical Reasoning": "Reading Comprehension",
  "Sentence Completion / Text Completion": "Sentence Completion",
};

async function renameTopics(subject: string, renames: Record<string, string>) {
  let totalUpdated = 0;
  for (const [from, to] of Object.entries(renames)) {
    const result = await prisma.question.updateMany({
      where: { subject, topic: from },
      data: { topic: to },
    });
    if (result.count > 0) {
      console.log(`  ${subject} | "${from}" → "${to}" (${result.count} questions)`);
      totalUpdated += result.count;
    }
  }
  return totalUpdated;
}

async function main() {
  console.log("=== Topic Normalization ===\n");

  console.log("QUANT:");
  const q = await renameTopics("QUANT", QUANT_RENAMES);

  console.log("\nLR:");
  const l = await renameTopics("LR", LR_RENAMES);

  console.log("\nVERBAL:");
  const v = await renameTopics("VERBAL", VERBAL_RENAMES);

  console.log(`\nDone. Total questions updated: ${q + l + v}`);

  // Print resulting topic distribution
  const byTopic = await prisma.question.groupBy({
    by: ["subject", "topic"],
    _count: { id: true },
    orderBy: [{ subject: "asc" }],
  });
  console.log("\n=== Final topic distribution ===");
  for (const r of byTopic) {
    console.log(`  ${r.subject.padEnd(8)} ${r.topic.padEnd(40)} ${r._count.id}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
