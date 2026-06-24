import { PrismaClient } from "../src/generated/prisma";
const p = new PrismaClient();
async function main() {
  const q1 = await p.question.findFirst({
    where: { stem: { contains: "grand total of all marks is contributed by student C" } }
  });
  console.log("=== Q24 (student C percentage) ===");
  console.log("id:", q1?.id);
  console.log("answer:", q1?.answer);
  console.log("options:", q1?.options);
  console.log("explanation:", q1?.explanation);
  console.log("passage (first 500):", q1?.passage?.slice(0, 500));

  const q2 = await p.question.findFirst({
    where: { stem: { contains: "fraction of girls is strictly between 48% and 50%" } }
  });
  console.log("\n=== Q (class size / fraction of girls) ===");
  console.log("id:", q2?.id);
  console.log("stem:", q2?.stem);
  console.log("answer:", q2?.answer);
  console.log("options:", q2?.options);
  console.log("explanation:", q2?.explanation);
}
main().catch(console.error).finally(() => p.$disconnect());
