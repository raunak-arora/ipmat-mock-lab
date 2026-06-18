import { PrismaClient } from "../src/generated/prisma";
const p = new PrismaClient();
async function main() {
  const jobs = await p.adminJob.findMany({ orderBy: { startedAt: "desc" }, take: 6 });
  for (const j of jobs) {
    const dur = j.finishedAt
      ? `${Math.round((j.finishedAt.getTime() - j.startedAt.getTime()) / 1000)}s`
      : `running ${Math.round((Date.now() - j.startedAt.getTime()) / 1000)}s`;
    console.log(`[${j.type}] ${j.status} — ${dur}`);
    if (j.result) {
      const r = JSON.parse(j.result);
      if (r.error) console.log("  ERROR:", r.error.slice(0, 300));
      else console.log("  keys:", Object.keys(r), "issueCount:", r.issueCount ?? "—");
    }
  }
}
main().catch(console.error).finally(() => p.$disconnect());
