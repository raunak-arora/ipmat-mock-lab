/**
 * One-time script: add any questions from the seed data that are not yet in the DB.
 * Safe to run repeatedly — it checks by stem before inserting.
 *
 * Usage:
 *   npx tsx scripts/add-questions.ts
 */
import { PrismaClient } from "../src/generated/prisma";
import { allSeedQuestions } from "../src/data";

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.question.count();
  console.log(`DB has ${before} questions. Seed data has ${allSeedQuestions.length} questions.`);

  const rows = await prisma.question.findMany({ select: { stem: true } });
  const existingStems = new Set(rows.map((r) => r.stem));

  const toAdd = allSeedQuestions.filter((q) => !existingStems.has(q.stem));
  if (toAdd.length === 0) {
    console.log("Nothing to add — all seed questions are already in the DB.");
    return;
  }

  console.log(`Inserting ${toAdd.length} new questions…`);
  for (const q of toAdd) {
    await prisma.question.create({
      data: {
        subject: q.subject,
        type: q.type,
        topic: q.topic,
        subTopic: q.subTopic ?? null,
        difficulty: q.difficulty,
        stem: q.stem,
        passage: q.passage ?? null,
        options: q.options ? JSON.stringify(q.options) : null,
        answer: q.answer,
        explanation: q.explanation ?? null,
        tags: q.tags ? JSON.stringify(q.tags) : null,
      },
    });
  }

  const after = await prisma.question.count();
  console.log(`Done. DB now has ${after} questions (+${after - before}).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
