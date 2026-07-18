/**
 * Remediation for the hand-written CAT seed questions (seed-cat-questions{,-2}.ts),
 * based on an independent re-solve of all 196. Three actions:
 *   1. WRONG_KEY  — answer corrected in place (25 questions)
 *   2. BROKEN     — deleted: inconsistent data / no valid option / duplicate correct options (27)
 *   3. BROKEN_FMT — restemmed with a typeable numeric answer (5)
 * Questions referenced by attempt history are fixed-in-place if possible, never deleted.
 *
 * Run: npx tsx scripts/fix-seed-defects.ts
 */
import { PrismaClient } from "../../src/generated/prisma";

const prisma = new PrismaClient();

/** stem prefix (unique enough) → corrected bare-text answer */
const WRONG_KEY: Array<{ prefix: string; answer: string; fixOptions?: (opts: string[]) => string[] }> = [
  { prefix: "N is the smallest 6-digit number", answer: "36" },
  { prefix: "Find the rightmost non-zero digit in 25!", answer: "4" },
  { prefix: "If |x - 3| + |x + 2| = 7", answer: "2" },
  { prefix: "The number of solutions to the equation x^[x] = 4", answer: "1" },
  { prefix: "A cone has radius r and slant height 2r", answer: "4/9" },
  { prefix: "The centroid of a triangle with vertices (1,4), (5,2)", answer: "6" },
  { prefix: "If f(x) = x/(1-x), find f(f(f(2)))", answer: "-2/5" },
  { prefix: "In an AP, the ratio of the sum of first 7 terms", answer: "6/7" },
  { prefix: "Which company showed the highest percentage growth from Q1 to Q3?", answer: "Alpha" },
  { prefix: "What is the total increase in enrolment across all subjects", answer: "118" },
  { prefix: "How many questions did the student answer correctly?", answer: "34" },
  { prefix: "If the top-left cell contains 16, the top-right contains 3", answer: "10" },
  { prefix: "If production starts at 9:00 AM, when is the item finished?", answer: "7:00 PM" },
  { prefix: "Which combination is consistent?", answer: "A=L, B=T, C=L" },
  { prefix: "A vessel has 60L of milk. 10L is removed and replaced with water", answer: "125/216" },
  { prefix: "A and B can complete a work in 12 and 18 days respectively. They start together", answer: "8" },
  { prefix: "Two circles of radii 5 cm and 3 cm have their centres 10 cm apart", answer: "√96 cm" },
  { prefix: "If the midpoint of the segment joining (a,b) and (3,4) is (2,3)", answer: "6" },
  { prefix: "From a group of 5 men and 6 women, a committee of 4", answer: "265" },
  {
    prefix: "A card is drawn at random from a pack of 52",
    answer: "11/26",
    // option "22/52" is numerically identical to the correct 11/26 — replace it
    fixOptions: (o) => o.map((x) => (x === "22/52" ? "9/26" : x)),
  },
  { prefix: "A speaks truth 75% of the time, B 80%", answer: "13/20" },
  { prefix: "A sequence satisfies aₙ=3aₙ₋₁-2 for n≥2, with a₁=5", answer: "325" },
  { prefix: "Who owns 5 books?", answer: "Cannot be determined" },
  { prefix: "How many passed exactly two subjects?", answer: "10" },
  { prefix: "Who is at the rightmost position?", answer: "C" },
];

/** stem prefixes of questions to delete (broken data / ambiguous / duplicate) */
const BROKEN: string[] = [
  "How many natural numbers between 1 and 500 are divisible by 3 or 7 but NOT",
  "If a, b, c are roots of x³ - 6x² + 11x - 6 = 0",
  "If 2^x = 3^y = 12^z",
  "A shopkeeper marks his goods 40% above cost price",
  "Pipes A and B can fill a tank in 12 and 18 hours respectively. Pipe C can empty it in 9 hours. All three are opened together", // dup of the fixed one + wrong key
  "A man covers a certain distance at 60 km/h and returns at 40 km/h",
  "A mixture of milk and water is in ratio 7:3",
  "The equation of the line passing through (2, -3) and perpendicular",
  "Three numbers are in G.P. Their product is 216 and the sum of their squares is 819",
  "The sum of infinite G.P. 1/2 + 1/4 + 1/8",
  "If log₂3 = a and log₃5 = b, then log₁₂450",
  "Simplify: log₁₀(25) + log₁₀(4) - log₁₀(2)",
  "How many 4-digit numbers can be formed using digits 1-7 (without repetition)",
  "A bag has 5 red and 3 blue balls. Two balls are drawn one after another",
  "In a survey of 100 students: 60 read newspaper A",
  "How many families own neither a car nor a two-wheeler?",
  "Who scored the 3rd highest?",
  "How many people like none of the three sports?",
  "If F is at the leftmost position, which of the following must be true?",
  "What is the position of R from the left?",
  "Which of the following is a valid order of completion?",
  "For how many integer values of k does the equation x² - kx + 1 = 0",
  "A invests Rs.10,000 at 10% CI per annum",
  "If tan θ = 4/3, find the value of (3 sin θ + 4 cos θ)/(3 sin θ - 4 cos θ)",
  "How many books does U own?",
  "Which of the following is the only consistent assignment?",
  "On which day did the temperature drop the most from the previous day?",
];

/** untypeable TITA answers → restem with numeric answer */
const RESTEM: Array<{ prefix: string; newStem: string; newAnswer: string; newExplanation: string }> = [
  {
    prefix: "Five sentences can be arranged to form a coherent paragraph",
    newStem: "Five sentences can be arranged to form a coherent paragraph. Choose the most logical order and type it as a 5-digit number with no spaces (e.g. 12345). (1) This process, called neuroplasticity, challenges the long-held belief that the adult brain is fixed. (2) The brain's ability to rewire itself in response to experience has profound implications for education and therapy. (3) Neurons that fire together wire together, a principle that explains habit formation. (4) Decades of research now show that adult brains retain significant capacity for structural change. (5) Early studies of stroke patients revealed that undamaged brain regions could compensate for damaged ones.",
    newAnswer: "54132",
    newExplanation: "5 (historical discovery) → 4 (research confirms adult plasticity) → 1 (names the process) → 3 (mechanism) → 2 (implications). Order: 54132.",
  },
  {
    prefix: "In what order should the projects be done",
    newStem: "Projects P, Q, R, S have deadlines in this order: S first, then R, then P, then Q. P depends on R (R must finish before P starts). Q depends on P. S has no dependencies. Which project is completed SECOND?",
    newAnswer: "R",
    newExplanation: "S has the earliest deadline and no dependencies → done first. R must precede P, which precedes Q → order S, R, P, Q. Second = R.",
  },
  {
    prefix: "If lights 1 and 4 are on, light 2 is off, and light 3 is on",
    newStem: "Four switches control four lights. Light 1 is on iff switch 1 is on. Light 2 is on iff both switches 1 and 2 are on. Light 3 is on iff exactly one of switches 2 or 3 is on. Light 4 is on iff switch 4 is off. If lights 1, 3 and 4 are on and light 2 is off, how many switches are ON?",
    newAnswer: "2",
    newExplanation: "Light1 on → S1 on. Light4 on → S4 off. Light2 off with S1 on → S2 off. Light3 on needs exactly one of S2/S3 → S3 on. ON switches: S1, S3 → 2.",
  },
  {
    prefix: "The ratio of the volumes of a cube to a sphere inscribed in it",
    newStem: "A sphere is inscribed in a cube. The ratio of the cube's volume to the sphere's volume equals k/π. Find k.",
    newAnswer: "6",
    newExplanation: "Cube side 2r → volume 8r³. Sphere volume (4/3)πr³. Ratio = 8r³ ÷ (4πr³/3) = 6/π → k = 6.",
  },
  {
    prefix: "From the top of a 100m high building, the angles of depression",
    newStem: "From the top of a 100 m building, the angles of depression of the top and bottom of a pole are 30° and 45° respectively. Find the height of the pole in metres, rounded to the nearest integer.",
    newAnswer: "42",
    newExplanation: "45° to the base → horizontal distance = 100 m. 30° to the top → 100 − h = 100/√3 ≈ 57.7 → h ≈ 42.3 → 42 m.",
  },
];

async function main() {
  let fixed = 0, deleted = 0, restemmed = 0, skipped = 0, inUseFixed = 0;

  const find = async (prefix: string) =>
    prisma.question.findFirst({ where: { stem: { startsWith: prefix }, subject: { in: ["CAT_QA", "CAT_VARC", "CAT_DILR"] } } });

  for (const f of WRONG_KEY) {
    const q = await find(f.prefix);
    if (!q) { console.warn(`WRONG_KEY not found: ${f.prefix.slice(0, 50)}`); skipped++; continue; }
    const data: { answer: string; options?: string } = { answer: f.answer };
    if (f.fixOptions && q.options) data.options = JSON.stringify(f.fixOptions(JSON.parse(q.options)));
    // MCQ sanity: corrected answer must exist among options
    if (q.type === "MCQ") {
      const opts: string[] = data.options ? JSON.parse(data.options) : JSON.parse(q.options ?? "[]");
      if (!opts.includes(f.answer)) { console.warn(`answer "${f.answer}" not in options for: ${f.prefix.slice(0, 50)} — options: ${opts}`); skipped++; continue; }
    }
    await prisma.question.update({ where: { id: q.id }, data });
    fixed++;
  }

  for (const prefix of BROKEN) {
    const q = await find(prefix);
    if (!q) { console.warn(`BROKEN not found: ${prefix.slice(0, 50)}`); skipped++; continue; }
    const used = await prisma.attemptAnswer.findFirst({ where: { questionId: q.id } });
    if (used) {
      // Referenced by attempt history — cannot delete without corrupting records.
      console.warn(`in use, NOT deleted (needs manual review): ${prefix.slice(0, 50)}`);
      inUseFixed++;
      continue;
    }
    await prisma.question.delete({ where: { id: q.id } });
    deleted++;
  }

  for (const r of RESTEM) {
    const q = await find(r.prefix);
    if (!q) { console.warn(`RESTEM not found: ${r.prefix.slice(0, 50)}`); skipped++; continue; }
    await prisma.question.update({
      where: { id: q.id },
      data: { stem: r.newStem, answer: r.newAnswer, explanation: r.newExplanation },
    });
    restemmed++;
  }

  console.log(`\nDone. Fixed keys: ${fixed} · Deleted broken: ${deleted} · Restemmed TITA: ${restemmed} · In-use (left): ${inUseFixed} · Not found/skipped: ${skipped}`);
  const total = await prisma.question.count({ where: { subject: { in: ["CAT_QA", "CAT_VARC", "CAT_DILR"] } } });
  console.log(`CAT questions remaining: ${total}`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
