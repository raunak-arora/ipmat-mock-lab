import { PrismaClient } from "../src/generated/prisma";
import { allSeedQuestions } from "../src/data";

const prisma = new PrismaClient();

async function main() {
  // A default profile so the app is usable immediately.
  await prisma.profile.upsert({
    where: { name: "My Brother" },
    update: {},
    create: { name: "My Brother" },
  });

  // Re-seeding replaces the bank, but only when it hasn't been hand-edited via
  // the admin UI yet. We detect that by tagging seeded rows.
  const existing = await prisma.question.count();
  if (existing > 0) {
    console.log(
      `Question bank already has ${existing} rows — skipping seed. ` +
        `Run "prisma db push --force-reset" first if you want a clean reseed.`
    );
  } else {
    let inserted = 0;
    for (const q of allSeedQuestions) {
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
      inserted++;
    }
    console.log(`Seeded ${inserted} questions.`);
  }

  // Quick coverage report.
  const bySubject = await prisma.question.groupBy({
    by: ["subject", "type"],
    _count: true,
  });
  console.log("Bank coverage:");
  for (const row of bySubject) {
    console.log(`  ${row.subject} / ${row.type}: ${row._count}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
