/**
 * Remediation for template-GENERATED CAT questions, from the generator audit:
 *  1. MCQs with "NaN" or duplicate options → delete
 *  2. Pie "How much more goes to X than Y" with answer ≤ 0 → delete (stem presupposes positive)
 *  3. Line-graph "rose the most" with tied max rises (recomputed from passage) → delete
 *  4. Bar-graph "grew the most" with tied max growth → delete
 *  5. Data-table "highest total / highest % growth" with ties → delete
 *  6. Surd TITA answers ("100√3", "50/√3", "√3/2") → JSON-array answers with decimal equivalents
 *  7. Bad ordinals ("2th", "23th") → fixed in stems
 *  8. CR assumption stem "if true, would be an assumption" → standard phrasing
 *
 * Run: npx tsx scripts/fix-generated-defects.ts
 */
import { PrismaClient } from "../../src/generated/prisma";

const prisma = new PrismaClient();
const CAT = ["CAT_QA", "CAT_VARC", "CAT_DILR"] as const;

const SQRT3 = Math.sqrt(3);
function surdAlternates(ans: string): string[] | null {
  let v: number | null = null;
  let m = ans.match(/^(\d+)√3$/);
  if (m) v = Number(m[1]) * SQRT3;
  m = ans.match(/^(\d+)\/√3$/);
  if (m) v = Number(m[1]) / SQRT3;
  if (ans === "√3/2") v = SQRT3 / 2;
  if (v === null) return null;
  const alts = new Set<string>([ans, v.toFixed(2), v.toFixed(1), String(Math.round(v))]);
  return [...alts];
}

const ord = (n: number) => {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10]}`;
};

async function main() {
  let deleted = 0, surdFixed = 0, ordinalFixed = 0, crFixed = 0;
  const canDelete = async (id: string) =>
    !(await prisma.attemptAnswer.findFirst({ where: { questionId: id } }));
  const del = async (id: string, why: string) => {
    if (await canDelete(id)) { await prisma.question.delete({ where: { id } }); deleted++; }
    else console.warn(`in use, kept: ${why}`);
  };

  // 1. NaN or duplicate options
  const mcqs = await prisma.question.findMany({
    where: { subject: { in: [...CAT] }, type: "MCQ" },
    select: { id: true, options: true, stem: true },
  });
  for (const q of mcqs) {
    if (!q.options) continue;
    const o: string[] = JSON.parse(q.options);
    if (o.some((x) => x === "NaN" || x.includes("NaN")) || new Set(o).size !== o.length) {
      await del(q.id, `bad options: ${q.stem.slice(0, 50)}`);
    }
  }
  const afterOpts = deleted;
  console.log(`NaN/duplicate options: ${afterOpts} deleted`);

  // 2. Pie negative/zero difference
  const pies = await prisma.question.findMany({
    where: { subject: "CAT_DILR", topic: "Pie Charts", stem: { startsWith: "How much more" } },
    select: { id: true, answer: true, stem: true },
  });
  for (const q of pies) {
    if (Number(q.answer) <= 0 || Number.isNaN(Number(q.answer))) await del(q.id, `pie ≤0: ${q.answer}`);
  }
  console.log(`Pie non-positive diffs: ${deleted - afterOpts} deleted`);
  const afterPie = deleted;

  // 3. Line-graph tie on max rise
  const lines = await prisma.question.findMany({
    where: { subject: "CAT_DILR", topic: "Line Graphs", stem: { contains: "rise the most" } },
    select: { id: true, passage: true },
  });
  for (const q of lines) {
    const vals = [...(q.passage ?? "").matchAll(/:\s*(-?\d+)/g)].map((m) => Number(m[1]));
    if (vals.length !== 7) continue;
    const diffs = vals.slice(1).map((v, i) => v - vals[i]);
    const max = Math.max(...diffs);
    if (diffs.filter((d) => d === max).length > 1 || max <= 0) await del(q.id, "line tie");
  }
  console.log(`Line-graph ties: ${deleted - afterPie} deleted`);
  const afterLine = deleted;

  // 4. Bar-graph growth ties
  const bars = await prisma.question.findMany({
    where: { subject: "CAT_DILR", topic: "Bar Graphs", stem: { contains: "grew the most" } },
    select: { id: true, passage: true },
  });
  for (const q of bars) {
    const rows = [...(q.passage ?? "").matchAll(/([XYZ])=(\d+)/g)];
    const byFac: Record<string, number[]> = {};
    for (const r of rows) (byFac[r[1]] ??= []).push(Number(r[2]));
    const g = Object.values(byFac).map((v) => (v[2] - v[0]) / v[0]);
    if (g.length === 3) {
      const max = Math.max(...g);
      if (g.filter((x) => Math.abs(x - max) < 1e-12).length > 1) await del(q.id, "bar tie");
    }
  }
  console.log(`Bar-graph ties: ${deleted - afterLine} deleted`);
  const afterBar = deleted;

  // 5. Data-table ties (totals and growth)
  const tables = await prisma.question.findMany({
    where: {
      subject: "CAT_DILR", topic: "Data Tables",
      OR: [{ stem: { contains: "highest total revenue" } }, { stem: { contains: "highest percentage growth" } }],
    },
    select: { id: true, passage: true, stem: true },
  });
  for (const q of tables) {
    const rows = [...(q.passage ?? "").matchAll(/^(\w+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)/gm)]
      .map((m) => [Number(m[2]), Number(m[3]), Number(m[4])]);
    if (rows.length !== 4) continue;
    const metric = q.stem.includes("total")
      ? rows.map((r) => r[0] + r[1] + r[2])
      : rows.map((r) => (r[2] - r[0]) / r[0]);
    const max = Math.max(...metric);
    if (metric.filter((x) => Math.abs(x - max) < 1e-12).length > 1) await del(q.id, "table tie");
  }
  console.log(`Data-table ties: ${deleted - afterBar} deleted`);

  // 6. Surd TITA → JSON-array answers
  const surds = await prisma.question.findMany({
    where: { subject: "CAT_QA", type: "SHORT_ANSWER", OR: [{ answer: { contains: "√" } }, { answer: { contains: "π" } }] },
    select: { id: true, answer: true },
  });
  for (const q of surds) {
    const alts = surdAlternates(q.answer);
    if (alts) {
      await prisma.question.update({ where: { id: q.id }, data: { answer: JSON.stringify(alts) } });
      surdFixed++;
    } else {
      console.warn(`surd pattern unrecognized (left as-is): ${q.answer}`);
    }
  }
  console.log(`Surd TITA converted to multi-answer: ${surdFixed}`);

  // 7. Bad ordinals in stems ("2th term", "23th")
  const ordinals = await prisma.question.findMany({
    where: { subject: "CAT_QA", stem: { contains: "th term" } },
    select: { id: true, stem: true },
  });
  for (const q of ordinals) {
    const fixedStem = q.stem.replace(/\b(\d+)th\b/g, (_, n) => ord(Number(n)));
    if (fixedStem !== q.stem) {
      await prisma.question.update({ where: { id: q.id }, data: { stem: fixedStem } });
      ordinalFixed++;
    }
  }
  console.log(`Ordinals fixed: ${ordinalFixed}`);

  // 8. CR assumption phrasing
  const crs = await prisma.question.findMany({
    where: { subject: "CAT_VARC", topic: "Critical Reasoning", stem: { contains: "would be an assumption required by" } },
    select: { id: true, stem: true },
  });
  for (const q of crs) {
    const s = q.stem.replace(
      /Which of the following, if true, would be an assumption required by the argument\?/,
      "Which of the following is an assumption on which the argument depends?"
    );
    if (s !== q.stem) {
      await prisma.question.update({ where: { id: q.id }, data: { stem: s } });
      crFixed++;
    }
  }
  console.log(`CR assumption stems fixed: ${crFixed}`);

  const total = await prisma.question.count({ where: { subject: { in: [...CAT] } } });
  console.log(`\nDone. Deleted: ${deleted} · Surd multi-answer: ${surdFixed} · Ordinals: ${ordinalFixed} · CR stems: ${crFixed}`);
  console.log(`CAT questions remaining: ${total}`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
