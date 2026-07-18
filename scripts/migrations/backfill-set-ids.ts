/**
 * One-time backfill: assign setId to existing questions that share an exact
 * passage (DILR caselets, RC passages) but predate the setId column.
 * Idempotent — only touches rows where setId is currently null.
 * Run: npx tsx scripts/backfill-set-ids.ts
 */
import { PrismaClient } from "../../src/generated/prisma";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

function newSetId(): string {
  return "set_" + randomBytes(9).toString("base64url");
}

async function main() {
  const rows = await prisma.question.findMany({
    where: { setId: null, passage: { not: null } },
    select: { id: true, passage: true },
  });

  const byPassage = new Map<string, string[]>();
  for (const r of rows) {
    const key = r.passage!;
    if (!byPassage.has(key)) byPassage.set(key, []);
    byPassage.get(key)!.push(r.id);
  }

  let groupsAssigned = 0, questionsAssigned = 0;
  for (const [, ids] of byPassage) {
    if (ids.length < 2) continue; // a lone question with a passage isn't a "set"
    const setId = newSetId();
    await prisma.question.updateMany({ where: { id: { in: ids } }, data: { setId } });
    groupsAssigned++;
    questionsAssigned += ids.length;
  }

  console.log(`Backfilled ${groupsAssigned} sets covering ${questionsAssigned} questions.`);
  console.log(`(${rows.length - questionsAssigned} passage-having questions left ungrouped — singletons.)`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
