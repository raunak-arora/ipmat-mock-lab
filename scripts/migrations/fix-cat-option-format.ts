/**
 * Fix CAT MCQ format: earlier seeds stored options as "A) text" with answer "A".
 * The grader compares given option TEXT against answer, so those would all grade wrong.
 * This converts options to bare text and answer to the correct option's bare text.
 * Run: npx tsx scripts/fix-cat-option-format.ts
 */
import { PrismaClient } from "../../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const qs = await prisma.question.findMany({
    where: { subject: { in: ["CAT_QA", "CAT_VARC", "CAT_DILR"] }, type: "MCQ" },
  });

  let fixed = 0, skipped = 0;
  for (const q of qs) {
    if (!q.options) { skipped++; continue; }
    let opts: string[];
    try { opts = JSON.parse(q.options); } catch { skipped++; continue; }

    // Detect "A) ..." prefixed options with a single-letter answer.
    const prefixed = opts.every((o) => /^[A-D]\)\s/.test(o));
    const letterAnswer = /^[A-D]$/.test(q.answer.trim());
    if (!prefixed || !letterAnswer) { skipped++; continue; }

    const letter = q.answer.trim();
    const correctOpt = opts.find((o) => o.startsWith(`${letter})`));
    if (!correctOpt) { console.warn(`No option for letter ${letter} on ${q.id}`); skipped++; continue; }

    const bare = opts.map((o) => o.replace(/^[A-D]\)\s*/, ""));
    const bareAnswer = correctOpt.replace(/^[A-D]\)\s*/, "");

    await prisma.question.update({
      where: { id: q.id },
      data: { options: JSON.stringify(bare), answer: bareAnswer },
    });
    fixed++;
  }
  console.log(`MCQ format fix: ${fixed} fixed, ${skipped} skipped (already bare or non-standard).`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
