import { PrismaClient } from "../src/generated/prisma";
const p = new PrismaClient();
async function main() {
  // Fix Q24: answer should be 22.5%, not 23.5%
  // 425/1850 = 22.97%, closest to 22.5% (diff 0.47) not 23.5% (diff 0.53)
  const q1 = await p.question.update({
    where: { id: "cmqdshauo001pul512d64hi48" },
    data: {
      answer: "22.5%",
      explanation: "Grand total = 390+340+425+330+365 = 1850. C's total = 425. Percentage = (425/1850)×100 = 22.97%. Among the options (22.5%, 23.5%, 24.5%, 25%), the closest is 22.5% (difference = 0.47 percentage points vs 0.53 for 23.5%).",
    },
    select: { id: true, answer: true, explanation: true },
  });
  console.log("Fixed Q24:", q1);
}
main().catch(console.error).finally(() => p.$disconnect());
