/**
 * CAT question bank generator — produces 2000+ template-based questions with
 * COMPUTED answers (no hand-written answer keys, so no key errors at scale).
 *
 * Run: npx tsx scripts/generate-cat-questions.ts
 * Idempotent: skips stems already in DB, dedups within the run.
 */
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

type Difficulty = "EASY" | "MEDIUM" | "HARD";
interface GenQ {
  subject: "CAT_QA" | "CAT_VARC" | "CAT_DILR";
  type: "MCQ" | "SHORT_ANSWER";
  topic: string;
  difficulty: Difficulty;
  stem: string;
  passage?: string;
  options?: string[];
  answer: string;
  explanation: string;
}

// ── RNG helpers ──────────────────────────────────────────────────────────────
const ri = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
/** Ordinal helper: 1st, 2nd, 3rd, 4th … 11th/12th/13th. */
const ord = (n: number) => {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10]}`;
};
/** MCQ options: correct + 3 distinct wrong values, shuffled, as bare text. */
function opts(correct: number | string, wrong: (number | string)[]): { options: string[]; answer: string } {
  const c = String(correct);
  const uniq = [...new Set(wrong.map(String).filter((w) => w !== c))].slice(0, 3);
  // Numeric padding only — a NaN base would emit "NaN" options.
  const base = Number(correct);
  if (uniq.length < 3 && Number.isNaN(base)) throw new Error(`opts(): non-numeric correct "${c}" needs 3 distinct wrong values`);
  let pad = 7;
  while (uniq.length < 3) {
    const cand = String(base + uniq.length + pad);
    if (cand !== c && !uniq.includes(cand)) uniq.push(cand);
    else pad++;
  }
  return { options: shuffle([c, ...uniq]), answer: c };
}

// ── CAT_QA templates ─────────────────────────────────────────────────────────
type Tpl = () => GenQ | null;

const QA_TPLS: Record<string, Tpl[]> = {
  "Number System": [
    () => { // trailing zeros in n!
      const n = ri(30, 400);
      let z = 0; for (let p = 5; p <= n; p *= 5) z += Math.floor(n / p);
      const o = opts(z, [z + 1, z - 1, z + 5]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Number System", difficulty: "MEDIUM",
        stem: `How many trailing zeros does ${n}! have?`, ...o,
        explanation: `Trailing zeros = ⌊${n}/5⌋ + ⌊${n}/25⌋ + … = ${z}.` };
    },
    () => { // highest power of prime p in n!
      const p = pick([2, 3, 7]); const n = ri(40, 200);
      let e = 0; for (let q = p; q <= n; q *= p) e += Math.floor(n / q);
      const o = opts(e, [e + 1, e - 1, e + 3]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Number System", difficulty: "MEDIUM",
        stem: `What is the highest power of ${p} that divides ${n}! ?`, ...o,
        explanation: `Legendre: Σ⌊${n}/${p}ᵏ⌋ = ${e}.` };
    },
    () => { // count divisible by a or b in [1,N]
      const [a, b] = pick([[3, 7], [4, 9], [5, 8], [6, 11], [3, 11], [7, 9]]);
      const N = pick([500, 600, 800, 1000, 1200]);
      const l = (a * b) / gcd(a, b);
      const cnt = Math.floor(N / a) + Math.floor(N / b) - Math.floor(N / l);
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Number System", difficulty: "MEDIUM",
        stem: `How many integers from 1 to ${N} are divisible by ${a} or ${b}?`, answer: String(cnt),
        explanation: `⌊${N}/${a}⌋ + ⌊${N}/${b}⌋ − ⌊${N}/${l}⌋ = ${Math.floor(N/a)} + ${Math.floor(N/b)} − ${Math.floor(N/l)} = ${cnt}.` };
    },
    () => { // units digit of a^n
      const base = ri(2, 9); const exp = ri(20, 300);
      const cyc: Record<number, number[]> = {2:[2,4,8,6],3:[3,9,7,1],4:[4,6],5:[5],6:[6],7:[7,9,3,1],8:[8,4,2,6],9:[9,1]};
      const c = cyc[base]; const u = c[(exp - 1) % c.length];
      const o = opts(u, [(u + 2) % 10, (u + 4) % 10, (u + 6) % 10]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Number System", difficulty: "EASY",
        stem: `What is the units digit of ${base}^${exp}?`, ...o,
        explanation: `Units digits of ${base}ⁿ cycle ${c.join(",")} (period ${c.length}). ${exp} mod ${c.length} position → ${u}.` };
    },
    () => { // number of factors
      const p1 = pick([2, 3]); const p2 = pick([5, 7]); const a = ri(2, 5); const b = ri(1, 3);
      const n = Math.pow(p1, a) * Math.pow(p2, b);
      const f = (a + 1) * (b + 1);
      const o = opts(f, [f + 2, f - 2, f + 4]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Number System", difficulty: "MEDIUM",
        stem: `How many positive divisors does ${n} have?`, ...o,
        explanation: `${n} = ${p1}^${a} × ${p2}^${b}. Divisors = (${a}+1)(${b}+1) = ${f}.` };
    },
    () => { // sum of first n odd/even
      const n = ri(15, 60); const odd = pick([true, false]);
      const s = odd ? n * n : n * (n + 1);
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Number System", difficulty: "EASY",
        stem: `Find the sum of the first ${n} ${odd ? "odd" : "even"} natural numbers.`, answer: String(s),
        explanation: odd ? `Sum of first n odd numbers = n² = ${n}² = ${s}.` : `Sum of first n even numbers = n(n+1) = ${n}×${n + 1} = ${s}.` };
    },
    () => { // remainder of big power mod small
      const combos = [[2, 7, 3], [3, 7, 6], [2, 5, 4], [3, 11, 5], [5, 7, 6], [2, 9, 6]] as const;
      const [base, mod, period] = pick(combos);
      const exp = ri(50, 500);
      const r = Math.pow(base, ((exp - 1) % period) + 1) % mod;
      const o = opts(r, [(r + 1) % mod, (r + 2) % mod, (r + 3) % mod]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Number System", difficulty: "HARD",
        stem: `Find the remainder when ${base}^${exp} is divided by ${mod}.`, ...o,
        explanation: `Powers of ${base} mod ${mod} cycle with period ${period}. ${exp} ≡ ${((exp - 1) % period) + 1} in the cycle → ${base}^${((exp - 1) % period) + 1} mod ${mod} = ${r}.` };
    },
  ],

  "Arithmetic": [
    () => { // successive discounts
      const mp = pick([500, 800, 1000, 1200, 1500, 2000, 2500]);
      const d1 = pick([10, 15, 20, 25, 30]); const d2 = pick([5, 10, 15, 20]);
      const sp = mp * (1 - d1 / 100) * (1 - d2 / 100);
      if (sp !== Math.round(sp)) return null;
      const o = opts(sp, [sp + 20, sp - 20, mp * (1 - (d1 + d2) / 100)]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Arithmetic", difficulty: "MEDIUM",
        stem: `An item marked at Rs.${mp} gets successive discounts of ${d1}% and ${d2}%. Find the selling price (in Rs.).`, ...o,
        explanation: `SP = ${mp} × ${(100 - d1)}/100 × ${(100 - d2)}/100 = Rs.${sp}. (Successive discounts multiply, they don't add.)` };
    },
    () => { // work together
      const a = pick([10, 12, 15, 18, 20, 24, 30]); const b = pick([15, 20, 24, 30, 36, 40, 60]);
      if (a === b) return null;
      const t = (a * b) / (a + b);
      if (t !== Math.round(t)) return null;
      const o = opts(t, [t + 2, t - 2, Math.round((a + b) / 2)]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Arithmetic", difficulty: "EASY",
        stem: `A can finish a job in ${a} days and B in ${b} days. Working together, in how many days will they finish it?`, ...o,
        explanation: `Combined rate = 1/${a} + 1/${b} = ${a + b}/${a * b}. Time = ${a * b}/${a + b} = ${t} days.` };
    },
    () => { // pipes with leak
      const f1 = pick([6, 8, 10, 12]); const f2 = pick([12, 15, 20, 24]); const e = pick([20, 24, 30, 40]);
      const net = 1 / f1 + 1 / f2 - 1 / e;
      if (net <= 0) return null;
      const t = 1 / net;
      if (Math.abs(t - Math.round(t)) > 1e-9) return null;
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Arithmetic", difficulty: "MEDIUM",
        stem: `Pipes A and B fill a tank in ${f1} and ${f2} hours respectively; pipe C empties it in ${e} hours. With all three open, in how many hours does the tank fill?`, answer: String(Math.round(t)),
        explanation: `Net rate = 1/${f1} + 1/${f2} − 1/${e} = 1/${Math.round(t)} per hour → ${Math.round(t)} hours.` };
    },
    () => { // average speed round trip
      const s1 = pick([30, 40, 45, 60]); const s2 = pick([60, 80, 90, 120]);
      if (s1 === s2) return null;
      const avg = (2 * s1 * s2) / (s1 + s2);
      if (avg !== Math.round(avg)) return null;
      const o = opts(avg, [(s1 + s2) / 2, avg + 4, avg - 4]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Arithmetic", difficulty: "MEDIUM",
        stem: `A man drives to office at ${s1} km/h and returns along the same route at ${s2} km/h. What is his average speed (km/h) for the whole journey?`, ...o,
        explanation: `Average speed for equal distances = harmonic mean = 2×${s1}×${s2}/(${s1}+${s2}) = ${avg} km/h (NOT the arithmetic mean ${(s1 + s2) / 2}).` };
    },
    () => { // train crossing platform
      const lt = pick([120, 150, 180, 200, 240, 300]); const lp = pick([180, 200, 240, 300, 360, 400]);
      const v = pick([10, 15, 20, 25, 30]);
      const tp = (lt + lp) / v;
      if (tp !== Math.round(tp)) return null;
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Arithmetic", difficulty: "EASY",
        stem: `A train ${lt} m long travels at ${v} m/s. How many seconds does it take to cross a platform ${lp} m long?`, answer: String(tp),
        explanation: `Time = (train + platform)/speed = (${lt}+${lp})/${v} = ${tp} s.` };
    },
    () => { // mixture replacement
      const V = pick([40, 50, 60, 80, 100]); const r = pick([10, 20, 25]);
      const k = pick([2, 3]);
      const frac = Math.pow(1 - r / V, k);
      const num = Math.pow(V - r, k), den = Math.pow(V, k);
      const g = gcd(num, den);
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Arithmetic", difficulty: "HARD",
        stem: `A vessel contains ${V} L of pure milk. ${r} L is removed and replaced with water; this operation is performed ${k} times in total. What fraction of the vessel is milk at the end? (Answer as a fraction, e.g. 16/25)`,
        answer: `${num / g}/${den / g}`,
        explanation: `Milk fraction after k replacements = (1 − ${r}/${V})^${k} = (${(V - r)}/${V})^${k} = ${num / g}/${den / g} ≈ ${(frac * 100).toFixed(1)}%.` };
    },
    () => { // compound interest amount
      const p = pick([5000, 8000, 10000, 12000, 16000, 20000]);
      const r = pick([5, 10, 20]); const t = pick([2, 3]);
      const amt = p * Math.pow(1 + r / 100, t);
      if (amt !== Math.round(amt)) return null;
      const si = p + (p * r * t) / 100;
      const o = opts(amt, [si, amt + 100, amt - 100]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Arithmetic", difficulty: "MEDIUM",
        stem: `Find the amount when Rs.${p} is invested for ${t} years at ${r}% per annum compound interest (annual compounding).`, ...o,
        explanation: `A = ${p} × (1.${r < 10 ? "0" + r : r})^${t} = Rs.${amt}. (SI would give Rs.${si}.)` };
    },
    () => { // profit % from CP/SP of equal counts
      const n1 = pick([4, 5, 6, 8]); const n2 = n1 + pick([1, 2]);
      // CP of n2 articles = SP of n1 articles → profit% = (n2-n1)/n1 ×100
      const pf = ((n2 - n1) / n1) * 100;
      if (pf !== Math.round(pf)) return null;
      const o = opts(pf, [pf + 5, pf - 5, Math.round(((n2 - n1) / n2) * 100)]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Arithmetic", difficulty: "HARD",
        stem: `The cost price of ${n2} articles equals the selling price of ${n1} articles. Find the profit percentage.`, ...o,
        explanation: `Let CP = Re.1/article. CP of ${n2} = ${n2} = SP of ${n1} → SP = ${n2}/${n1} per article. Profit% = (${n2 - n1}/${n1})×100 = ${pf}%.` };
    },
  ],

  "Algebra": [
    () => { // x + 1/x powers
      const s = pick([3, 4, 5, 6]);
      const x2 = s * s - 2; const x3 = s * (x2 - 1);
      const target = pick([2, 3] as const);
      const val = target === 2 ? x2 : x3;
      const o = opts(val, [val + 2, val - 2, s * s]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Algebra", difficulty: "MEDIUM",
        stem: `If x + 1/x = ${s}, find the value of x${target === 2 ? "²" : "³"} + 1/x${target === 2 ? "²" : "³"}.`, ...o,
        explanation: target === 2
          ? `x² + 1/x² = (x + 1/x)² − 2 = ${s * s} − 2 = ${x2}.`
          : `x³ + 1/x³ = (x + 1/x)³ − 3(x + 1/x) = ${s ** 3} − ${3 * s} = ${x3}.` };
    },
    () => { // quadratic roots sum/product
      const r1 = ri(1, 9); const r2 = ri(1, 9);
      const b = r1 + r2, c = r1 * r2;
      const ask = pick(["sum of the squares of the roots", "sum of the reciprocals of the roots"] as const);
      let val: string; let expl: string;
      if (ask.includes("squares")) {
        const v = b * b - 2 * c; val = String(v);
        expl = `α²+β² = (α+β)² − 2αβ = ${b}² − 2×${c} = ${v}.`;
      } else {
        const g = gcd(b, c); val = c % b === 0 ? String(b / c) : `${b / g}/${c / g}`;
        val = `${b / g}/${c / g}`;
        expl = `1/α + 1/β = (α+β)/αβ = ${b}/${c}${g > 1 ? ` = ${b / g}/${c / g}` : ""}.`;
      }
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Algebra", difficulty: "MEDIUM",
        stem: `For the equation x² − ${b}x + ${c} = 0, find the ${ask}. (Fractions like 5/6 are accepted.)`, answer: val, explanation: expl };
    },
    () => { // linear system
      const x = ri(2, 12); const y = ri(2, 12);
      const a1 = ri(2, 5), b1 = ri(2, 5), a2 = ri(2, 5), b2 = ri(2, 5);
      if (a1 * b2 === a2 * b1) return null;
      const c1 = a1 * x + b1 * y, c2 = a2 * x - b2 * y;
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Algebra", difficulty: "EASY",
        stem: `If ${a1}x + ${b1}y = ${c1} and ${a2}x − ${b2}y = ${c2}, find x + y.`, answer: String(x + y),
        explanation: `Solving the pair gives x = ${x}, y = ${y}; x + y = ${x + y}.` };
    },
    () => { // |x-a|+|x+b| = c solutions
      const a = ri(1, 6); const b = ri(1, 6);
      const base = a + b; const extra = pick([2, 4, 6]);
      const c = base + extra;
      // solutions: x = a + extra/2 and x = -b - extra/2 → 2 solutions
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Algebra", difficulty: "HARD",
        stem: `How many real solutions does |x − ${a}| + |x + ${b}| = ${c} have?`, answer: "2",
        explanation: `Minimum of LHS is ${base} (for −${b} ≤ x ≤ ${a}). Since ${c} > ${base}, exactly two solutions: one beyond each end (x = ${a + extra / 2} and x = −${b + extra / 2}).` };
    },
    () => { // min of quadratic
      const a = pick([1, 2, 3]); const h = ri(1, 8); const k = ri(-10, 10);
      const b = -2 * a * h; const c = a * h * h + k;
      const o = opts(k, [k + a, k - a, c]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Algebra", difficulty: "MEDIUM",
        stem: `Find the minimum value of f(x) = ${a}x² ${b >= 0 ? "+ " + b : "− " + Math.abs(b)}x ${c >= 0 ? "+ " + c : "− " + Math.abs(c)}.`, ...o,
        explanation: `Vertex at x = −b/2a = ${h}. Minimum = f(${h}) = ${k}.` };
    },
    () => { // AM-GM max product
      const s = pick([20, 24, 30, 36, 40, 48]);
      const maxP = (s / 2) * (s / 2);
      const o = opts(maxP, [maxP - s / 2, maxP + s / 2, s * 2]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Algebra", difficulty: "MEDIUM",
        stem: `If x + y = ${s} where x, y are positive reals, what is the maximum value of xy?`, ...o,
        explanation: `By AM–GM, xy is maximised when x = y = ${s / 2}; max = ${s / 2}² = ${maxP}.` };
    },
  ],

  "Geometry & Mensuration": [
    () => { // right triangle hypotenuse / area
      const trip = pick([[3,4,5],[6,8,10],[5,12,13],[9,12,15],[8,15,17],[7,24,25],[12,16,20],[10,24,26],[20,21,29]]);
      const k = pick([1, 2]); const [a, b, c] = trip.map((v) => v * k);
      const ask = pick(["area", "perimeter"] as const);
      const val = ask === "area" ? (a * b) / 2 : a + b + c;
      const o = opts(val, [val + 6, val - 6, ask === "area" ? a * b : val + 12]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Geometry & Mensuration", difficulty: "EASY",
        stem: `A right-angled triangle has legs ${a} cm and ${b} cm. Find its ${ask} (in ${ask === "area" ? "cm²" : "cm"}).`, ...o,
        explanation: ask === "area" ? `Area = ½ × ${a} × ${b} = ${val} cm².` : `Hypotenuse = √(${a}²+${b}²) = ${c}. Perimeter = ${a}+${b}+${c} = ${val} cm.` };
    },
    () => { // rhombus from diagonals
      const pairs = [[6,8],[10,24],[12,16],[16,30],[18,24],[14,48],[20,48]] as const;
      const [d1, d2] = pick(pairs);
      const side = Math.sqrt((d1 / 2) ** 2 + (d2 / 2) ** 2);
      const ask = pick(["perimeter", "area"] as const);
      const val = ask === "perimeter" ? 4 * side : (d1 * d2) / 2;
      const o = opts(val, [val + 8, val - 8, ask === "area" ? d1 * d2 : 2 * side]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Geometry & Mensuration", difficulty: "MEDIUM",
        stem: `The diagonals of a rhombus measure ${d1} cm and ${d2} cm. Find its ${ask} (in ${ask === "area" ? "cm²" : "cm"}).`, ...o,
        explanation: ask === "perimeter"
          ? `Side = √((${d1}/2)² + (${d2}/2)²) = ${side}. Perimeter = 4×${side} = ${val} cm.`
          : `Area of rhombus = ½ d₁d₂ = ½ × ${d1} × ${d2} = ${val} cm².` };
    },
    () => { // cylinder volume/CSA with π = 22/7
      const r = pick([7, 14, 21]); const h = pick([5, 10, 12, 15, 20]);
      const ask = pick(["volume", "curved surface area"] as const);
      const val = ask === "volume" ? (22 / 7) * r * r * h : 2 * (22 / 7) * r * h;
      if (val !== Math.round(val)) return null;
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Geometry & Mensuration", difficulty: "EASY",
        stem: `A cylinder has radius ${r} cm and height ${h} cm. Find its ${ask} (in cm${ask === "volume" ? "³" : "²"}; use π = 22/7).`, answer: String(val),
        explanation: ask === "volume" ? `V = πr²h = (22/7)×${r}²×${h} = ${val} cm³.` : `CSA = 2πrh = 2×(22/7)×${r}×${h} = ${val} cm².` };
    },
    () => { // similar triangles area ratio
      const m = ri(2, 5); const n = m + ri(1, 4);
      const o = opts(`${m * m}:${n * n}`, [`${m}:${n}`, `${2 * m}:${2 * n}`, `${m * m * m}:${n * n * n}`]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Geometry & Mensuration", difficulty: "MEDIUM",
        stem: `Two similar triangles have corresponding sides in the ratio ${m}:${n}. What is the ratio of their areas?`, ...o,
        explanation: `Ratio of areas of similar figures = square of the side ratio = ${m}²:${n}² = ${m * m}:${n * n}.` };
    },
    () => { // sphere/cone volume with π=22/7 kept symbolic
      const r = pick([3, 6, 9]); const h = pick([4, 7, 14, 21]);
      const v = Math.round((1 / 3) * r * r * h); // coefficient of π
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Geometry & Mensuration", difficulty: "MEDIUM",
        stem: `A cone has radius ${r} cm and height ${h} cm. Its volume is kπ cm³. Find k.`, answer: String(v),
        explanation: `V = ⅓πr²h = ⅓π×${r * r}×${h} = ${v}π cm³ → k = ${v}.` };
    },
    () => { // equilateral triangle from circumradius etc
      const a = pick([6, 12, 18, 24, 30]);
      const ask = pick(["inradius", "circumradius"] as const);
      const k = ask === "inradius" ? a / (2 * Math.sqrt(3)) : a / Math.sqrt(3);
      const coef = ask === "inradius" ? a / 6 : a / 3; // in terms of √3: r = a/(2√3) = a√3/6
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Geometry & Mensuration", difficulty: "HARD",
        stem: `An equilateral triangle has side ${a} cm. Its ${ask} equals k√3 cm. Find k.`, answer: String(coef),
        explanation: ask === "inradius"
          ? `r = a/(2√3) = a√3/6 = ${a}√3/6 = ${coef}√3 cm.`
          : `R = a/√3 = a√3/3 = ${a}√3/3 = ${coef}√3 cm.` };
    },
  ],

  "Coordinate Geometry": [
    () => { // distance between points
      const trip = pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15],[7,24,25]]);
      const [dx, dy, d] = trip;
      const x1 = ri(-5, 5), y1 = ri(-5, 5);
      const o = opts(d, [d + 1, d - 1, dx + dy]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Coordinate Geometry", difficulty: "EASY",
        stem: `Find the distance between the points (${x1}, ${y1}) and (${x1 + dx}, ${y1 + dy}).`, ...o,
        explanation: `d = √(${dx}² + ${dy}²) = √${dx * dx + dy * dy} = ${d}.` };
    },
    () => { // area of triangle with axes
      const a = pick([2, 3, 4, 5, 6]); const b = pick([3, 4, 5, 6, 8]);
      const c = a * b * pick([1, 2]); // line ax + by = c → intercepts c/a, c/b
      const area = (c / a) * (c / b) / 2;
      if (area !== Math.round(area)) return null;
      const o = opts(area, [area * 2, area + 3, area - 3]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Coordinate Geometry", difficulty: "MEDIUM",
        stem: `Find the area (sq. units) of the triangle formed by the line ${a}x + ${b}y = ${c} with the coordinate axes.`, ...o,
        explanation: `Intercepts: x = ${c / a}, y = ${c / b}. Area = ½ × ${c / a} × ${c / b} = ${area}.` };
    },
    () => { // section formula midpoint
      const x1 = ri(-8, 8), y1 = ri(-8, 8);
      const mx = ri(-5, 5), my = ri(-5, 5);
      const x2 = 2 * mx - x1, y2 = 2 * my - y1;
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Coordinate Geometry", difficulty: "EASY",
        stem: `The midpoint of the segment joining (${x1}, ${y1}) and (a, b) is (${mx}, ${my}). Find a + b.`, answer: String(x2 + y2),
        explanation: `a = 2×${mx} − ${x1} = ${x2}; b = 2×${my} − ${y1} = ${y2}. a + b = ${x2 + y2}.` };
    },
    () => { // slope / perpendicular slope
      const m1n = ri(1, 6); const m1d = ri(1, 6);
      if (m1n === m1d) return null; // slope 1/1 → "-1/1" correct + NaN padding
      const g = gcd(m1n, m1d);
      const num = m1n / g, den = m1d / g;
      const o = opts(`-${den}/${num}`, [`${den}/${num}`, `-${num}/${den}`, `${num}/${den}`]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Coordinate Geometry", difficulty: "EASY",
        stem: `A line has slope ${num}/${den}. What is the slope of a line perpendicular to it?`, ...o,
        explanation: `Perpendicular slopes multiply to −1: m₂ = −1/(${num}/${den}) = −${den}/${num}.` };
    },
    () => { // distance between parallel lines
      const trip = pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17]]);
      const [a, b, den] = trip;
      const dist = pick([2, 3, 4, 5]);
      const c1 = ri(-10, 10); const c2 = c1 + dist * den;
      const fmt = (c: number) => (c >= 0 ? `+ ${c}` : `− ${Math.abs(c)}`);
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Coordinate Geometry", difficulty: "MEDIUM",
        stem: `Find the distance between the parallel lines ${a}x + ${b}y ${fmt(c1)} = 0 and ${a}x + ${b}y ${fmt(c2)} = 0.`, answer: String(dist),
        explanation: `d = |c₂ − c₁|/√(a²+b²) = ${dist * den}/√${a * a + b * b} = ${dist * den}/${den} = ${dist}.` };
    },
  ],

  "Trigonometry": [
    () => { // basic identity from tan
      const trip = pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29]]);
      const [o1, a1, h] = trip;
      const ask = pick(["sin", "cos"] as const);
      const num = ask === "sin" ? o1 : a1;
      const g = gcd(num, h);
      const oo = opts(`${num / g}/${h / g}`, [`${a1}/${h}` === `${num}/${h}` ? `${o1}/${h}` : `${a1}/${h}`, `${num}/${o1 + a1}`, `${h}/${num}`]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Trigonometry", difficulty: "EASY",
        stem: `If tan θ = ${o1}/${a1} and θ is acute, find ${ask} θ.`, ...oo,
        explanation: `Right triangle with opposite ${o1}, adjacent ${a1} → hypotenuse ${h}. ${ask} θ = ${num}/${h}.` };
    },
    () => { // tower height/distance
      const combos = [[30, "√3", 1], [45, "1", 1], [60, "1/√3", 1]] as const;
      const [ang, , ] = pick(combos);
      const h = pick([20, 30, 40, 50, 60, 80, 100]);
      const S3 = Math.sqrt(3);
      let ansTxt: string; let expl: string;
      if (ang === 45) { ansTxt = String(h); expl = `tan45° = 1 → distance = height = ${h} m.`; }
      else if (ang === 30) {
        const v = h * S3;
        ansTxt = JSON.stringify([`${h}√3`, v.toFixed(2), v.toFixed(1), String(Math.round(v))]);
        expl = `tan30° = 1/√3 = ${h}/d → d = ${h}√3 ≈ ${v.toFixed(1)} m.`;
      } else {
        const v = h / S3;
        ansTxt = JSON.stringify([`${h}/√3`, v.toFixed(2), v.toFixed(1), String(Math.round(v))]);
        expl = `tan60° = √3 = ${h}/d → d = ${h}/√3 ≈ ${v.toFixed(1)} m.`;
      }
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Trigonometry", difficulty: "MEDIUM",
        stem: `From a point on level ground, the angle of elevation of the top of a ${h} m tower is ${ang}°. Find the distance (in m) of the point from the tower's base. (Surd form like 50√3 or its decimal value accepted.)`,
        answer: ansTxt, explanation: expl };
    },
    () => { // evaluate standard-angle expression
      const items = [
        { e: "sin²30° + cos²60°", v: "1/2", x: "(1/2)² + (1/2)² = 1/4 + 1/4 = 1/2." },
        { e: "sin30° + cos60°", v: "1", x: "1/2 + 1/2 = 1." },
        { e: "tan45° + sin90°", v: "2", x: "1 + 1 = 2." },
        { e: "sin60° × cos30°", v: "3/4", x: "(√3/2)(√3/2) = 3/4." },
        { e: "tan30° × tan60°", v: "1", x: "(1/√3)(√3) = 1." },
        { e: "sin²45° + cos²45°", v: "1", x: "1/2 + 1/2 = 1 (Pythagorean identity)." },
        { e: "2sin30°cos30°", v: JSON.stringify(["√3/2", "0.87", "0.866"]), x: "= sin60° = √3/2 ≈ 0.866." },
        { e: "cos²30° − sin²30°", v: "1/2", x: "= cos60° = 1/2." },
      ];
      const it = pick(items);
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Trigonometry", difficulty: "EASY",
        stem: `Evaluate: ${it.e}. (Fractions and surds like 3/4 or √3/2 accepted.)`, answer: it.v, explanation: it.x };
    },
  ],

  "Functions & Progressions": [
    () => { // AP nth term
      const a = ri(2, 15); const d = ri(2, 9); const n = ri(10, 40);
      const t = a + (n - 1) * d;
      const o = opts(t, [t + d, t - d, t + 2 * d]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Functions & Progressions", difficulty: "EASY",
        stem: `In an AP with first term ${a} and common difference ${d}, find the ${ord(n)} term.`, ...o,
        explanation: `tₙ = a + (n−1)d = ${a} + ${n - 1}×${d} = ${t}.` };
    },
    () => { // AP sum
      const a = ri(1, 10); const d = pick([2, 3, 4, 5]); const n = pick([10, 12, 15, 20, 25]);
      const s = (n / 2) * (2 * a + (n - 1) * d);
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Functions & Progressions", difficulty: "EASY",
        stem: `Find the sum of the first ${n} terms of the AP: ${a}, ${a + d}, ${a + 2 * d}, …`, answer: String(s),
        explanation: `Sₙ = n/2 × (2a + (n−1)d) = ${n}/2 × (${2 * a} + ${(n - 1) * d}) = ${s}.` };
    },
    () => { // GP nth term / common ratio
      const r = pick([2, 3]); const a = pick([2, 3, 5]);
      const n1 = ri(2, 4); const n2 = n1 + pick([2, 3]);
      const t1 = a * Math.pow(r, n1 - 1), t2 = a * Math.pow(r, n2 - 1);
      const o = opts(r, [r + 1, r - 1, r * 2]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Functions & Progressions", difficulty: "MEDIUM",
        stem: `In a GP, the ${ord(n1)} term is ${t1} and the ${ord(n2)} term is ${t2}. Find the common ratio.`, ...o,
        explanation: `t${n2}/t${n1} = r^${n2 - n1} = ${t2}/${t1} = ${t2 / t1} → r = ${r}.` };
    },
    () => { // infinite GP
      const rNum = 1; const rDen = pick([2, 3, 4, 5]);
      const a = pick([rDen - 1, rDen, 2 * (rDen - 1)]);
      const s = a / (1 - rNum / rDen);
      if (s !== Math.round(s)) return null;
      const o = opts(s, [s + 1, s - 1, a * rDen]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Functions & Progressions", difficulty: "MEDIUM",
        stem: `Find the sum to infinity of the GP: ${a}, ${a}/${rDen}, ${a}/${rDen * rDen}, …`, ...o,
        explanation: `S∞ = a/(1−r) = ${a}/(1 − 1/${rDen}) = ${a}×${rDen}/${rDen - 1} = ${s}.` };
    },
    () => { // telescoping
      const n = pick([50, 99, 100, 199, 200]);
      const num = n, den = n + 1;
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Functions & Progressions", difficulty: "HARD",
        stem: `Evaluate: 1/(1×2) + 1/(2×3) + … + 1/(${n}×${n + 1}). (Answer as a fraction.)`, answer: `${num}/${den}`,
        explanation: `1/(k(k+1)) = 1/k − 1/(k+1); the sum telescopes to 1 − 1/${n + 1} = ${num}/${den}.` };
    },
    () => { // three numbers in AP given sum & product-ish
      const a = pick([5, 6, 7, 8, 9, 10, 12]); const d = pick([2, 3, 4, 5]);
      const sum = 3 * a; const prod = (a - d) * a * (a + d);
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Functions & Progressions", difficulty: "HARD",
        stem: `Three numbers in AP have sum ${sum} and product ${prod}. Find the largest of the three.`, answer: String(a + d),
        explanation: `Let a−d, a, a+d: 3a = ${sum} → a = ${a}. a(a²−d²) = ${prod} → d² = ${d * d} → d = ${d}. Largest = ${a + d}.` };
    },
  ],

  "Logarithms & Surds": [
    () => { // log equation
      const b = pick([2, 3, 5]); const e = ri(3, 8);
      const n = Math.pow(b, e);
      if (n > 100000) return null;
      const o = opts(e, [e + 1, e - 1, b]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Logarithms & Surds", difficulty: "EASY",
        stem: `Find the value of log${b === 2 ? "₂" : b === 3 ? "₃" : "₅"}(${n}).`, ...o,
        explanation: `${b}^${e} = ${n}, so log base ${b} of ${n} = ${e}.` };
    },
    () => { // combine logs
      const a = pick([2, 4, 5, 8]); const b2 = pick([5, 10, 20, 25]);
      const prod = a * b2;
      if (![10, 100, 1000].includes(prod)) return null;
      const v = Math.log10(prod);
      const o = opts(v, [v + 1, v - 1, prod / 10]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Logarithms & Surds", difficulty: "EASY",
        stem: `Evaluate: log₁₀(${a}) + log₁₀(${b2}).`, ...o,
        explanation: `log(${a}) + log(${b2}) = log(${prod}) = ${v}.` };
    },
    () => { // number of digits
      const b = pick([2, 3]); const e = pick([10, 20, 30, 40, 50, 64, 100]);
      const log = b === 2 ? 0.30103 : 0.47712;
      const digits = Math.floor(e * log) + 1;
      const o = opts(digits, [digits + 1, digits - 1, e]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Logarithms & Surds", difficulty: "HARD",
        stem: `How many digits does ${b}^${e} have? (log₁₀${b} ≈ ${log})`, ...o,
        explanation: `Digits = ⌊${e} × ${log}⌋ + 1 = ⌊${(e * log).toFixed(3)}⌋ + 1 = ${digits}.` };
    },
    () => { // surd simplification √a×√b
      const a = pick([2, 3, 5, 6, 8]); const b2 = pick([2, 3, 8, 12, 18, 27, 32, 50]);
      const prod = a * b2;
      const s = Math.sqrt(prod);
      if (s !== Math.round(s)) return null;
      const o = opts(s, [s + 1, s - 1, prod]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Logarithms & Surds", difficulty: "EASY",
        stem: `Simplify: √${a} × √${b2}.`, ...o,
        explanation: `√${a} × √${b2} = √${prod} = ${s}.` };
    },
    () => { // rationalize 1/(√a - √b)
      const b2 = pick([2, 3, 5, 6, 7]); const a = b2 + 1;
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Logarithms & Surds", difficulty: "MEDIUM",
        stem: `Simplify 1/(√${a} − √${b2}) into the form √${a} + √${b2} divided by an integer k. Find k.`, answer: "1",
        explanation: `Multiply by (√${a} + √${b2})/(√${a} + √${b2}): denominator = ${a} − ${b2} = 1, so the expression = √${a} + √${b2}; k = 1.` };
    },
  ],

  "Permutation and Combination": [
    () => { // arrangements with repeats
      const words = [
        { w: "BANANA", v: 60, x: "6!/(3!2!) = 720/12 = 60 (A×3, N×2)." },
        { w: "SUCCESS", v: 420, x: "7!/(3!2!) = 5040/12 = 420 (S×3, C×2)." },
        { w: "BALLOON", v: 1260, x: "7!/(2!2!) = 5040/4 = 1260 (L×2, O×2)." },
        { w: "MISSISSIPPI", v: 34650, x: "11!/(4!4!2!) = 34650 (I×4, S×4, P×2)." },
        { w: "COFFEE", v: 180, x: "6!/(2!2!) = 720/4 = 180 (F×2, E×2)." },
        { w: "LETTER", v: 180, x: "6!/(2!2!) = 180 (T×2, E×2)." },
        { w: "PEPPER", v: 60, x: "6!/(3!2!) = 60 (P×3, E×2)." },
        { w: "ARRANGE", v: 1260, x: "7!/(2!2!) = 1260 (A×2, R×2)." },
      ];
      const it = pick(items(words));
      const o = opts(it.v, [it.v * 2, it.v / 2, it.v + 60]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Permutation and Combination", difficulty: "MEDIUM",
        stem: `In how many distinct ways can the letters of the word ${it.w} be arranged?`, ...o,
        explanation: it.x };
      function items<T>(x: T[]) { return x; }
    },
    () => { // committee with constraint
      const m = ri(5, 8); const w = ri(4, 6); const size = 4; const minW = 2;
      let total = 0; const parts: string[] = [];
      for (let k = minW; k <= Math.min(size, w); k++) {
        const c = C(w, k) * C(m, size - k);
        total += c; parts.push(`${k}W: C(${w},${k})×C(${m},${size - k})=${c}`);
      }
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Permutation and Combination", difficulty: "HARD",
        stem: `From ${m} men and ${w} women, a committee of ${size} is formed with at least ${minW} women. In how many ways?`, answer: String(total),
        explanation: parts.join("; ") + ` → total ${total}.` };
    },
    () => { // circular arrangements with pair together
      const n = ri(5, 8);
      const v = fact(n - 2) * 2;
      const o = opts(v, [fact(n - 1), fact(n - 2), v * 2]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Permutation and Combination", difficulty: "MEDIUM",
        stem: `${n} people sit around a circular table. In how many ways can they be seated if two particular people must sit together?`, ...o,
        explanation: `Tie the pair into one unit: (${n - 1} units) → (${n - 2})! circular arrangements × 2 internal swaps = ${fact(n - 2)}×2 = ${v}.` };
    },
    () => { // stars and bars
      const n = ri(6, 15); const k = pick([3, 4]);
      const pos = pick([true, false]);
      const v = pos ? C(n - 1, k - 1) : C(n + k - 1, k - 1);
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Permutation and Combination", difficulty: "HARD",
        stem: `How many ${pos ? "positive" : "non-negative"} integer solutions does x₁ + x₂ ${k >= 3 ? "+ x₃ " : ""}${k === 4 ? "+ x₄ " : ""}= ${n} have?`,
        answer: String(v),
        explanation: pos ? `Positive solutions = C(n−1, k−1) = C(${n - 1},${k - 1}) = ${v}.` : `Non-negative solutions = C(n+k−1, k−1) = C(${n + k - 1},${k - 1}) = ${v}.` };
    },
    () => { // choose r from n
      const n = ri(6, 12); const r = ri(2, 4);
      const v = C(n, r);
      const o = opts(v, [C(n, r + 1), C(n + 1, r), v + n]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Permutation and Combination", difficulty: "EASY",
        stem: `A team of ${r} is to be selected from ${n} players. In how many ways can this be done?`, ...o,
        explanation: `C(${n},${r}) = ${v}.` };
    },
  ],

  "Probability": [
    () => { // balls without replacement
      const r = ri(3, 7); const b = ri(3, 7);
      const num = r * (r - 1), den = (r + b) * (r + b - 1);
      const g = gcd(num, den);
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Probability", difficulty: "MEDIUM",
        stem: `A bag has ${r} red and ${b} blue balls. Two balls are drawn without replacement. Find the probability both are red. (Fraction accepted.)`,
        answer: `${num / g}/${den / g}`,
        explanation: `P = (${r}/${r + b}) × (${r - 1}/${r + b - 1}) = ${num / g}/${den / g}.` };
    },
    () => { // dice sum probability
      const s = ri(4, 10);
      const count = [0,0,1,2,3,4,5,6,5,4,3,2,1][s] ?? 0;
      const g = gcd(count, 36);
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Probability", difficulty: "MEDIUM",
        stem: `Two fair dice are rolled. What is the probability that the sum equals ${s}? (Fraction accepted.)`,
        answer: `${count / g}/${36 / g}`,
        explanation: `Ways to get ${s} with two dice = ${count}; P = ${count}/36 = ${count / g}/${36 / g}.` };
    },
    () => { // at least one head
      const n = ri(2, 5);
      const den = Math.pow(2, n);
      const num = den - 1;
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Probability", difficulty: "EASY",
        stem: `A fair coin is tossed ${n} times. What is the probability of getting at least one head? (Fraction accepted.)`,
        answer: `${num}/${den}`,
        explanation: `P(no heads) = (1/2)^${n} = 1/${den}. P(≥1 head) = 1 − 1/${den} = ${num}/${den}.` };
    },
    () => { // independent both/agree
      const p1 = pick([60, 70, 75, 80, 90]); const p2 = pick([50, 60, 70, 80]);
      const both = (p1 * p2) / 100;
      if (both !== Math.round(both)) return null;
      const o = opts(`${both}%`, [`${p1 + p2 - 100}%`, `${Math.round((p1 + p2) / 2)}%`, `${both + 10}%`]);
      return { subject: "CAT_QA", type: "MCQ", topic: "Probability", difficulty: "EASY",
        stem: `A hits a target ${p1}% of the time; B hits it ${p2}% of the time, independently. What is the probability that both hit the target?`, ...o,
        explanation: `P(both) = ${p1 / 100} × ${p2 / 100} = ${both / 100} = ${both}%.` };
    },
    () => { // expected value
      const win = pick([2, 3, 4, 5, 6]); const lose = pick([1, 2]);
      const e = (win - lose) / 2;
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Probability", difficulty: "MEDIUM",
        stem: `A game pays Rs.${win} for heads and takes Rs.${lose} for tails on a fair coin flip. What is the expected gain (in Rs.) per flip? (Decimals accepted.)`,
        answer: String(e),
        explanation: `E = ½×${win} + ½×(−${lose}) = ${e}.` };
    },
  ],

  "Modern Maths": [
    () => { // two-set venn
      const total = pick([80, 100, 120, 150, 200]);
      const both = ri(10, 30);
      const onlyA = ri(20, 60); const onlyB = ri(15, 50);
      const none = total - onlyA - onlyB - both;
      if (none < 0) return null;
      const A = onlyA + both, B = onlyB + both;
      const ask = pick(["both", "none", "onlyA"] as const);
      const val = ask === "both" ? both : ask === "none" ? none : onlyA;
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Modern Maths", difficulty: "MEDIUM",
        stem: `In a group of ${total} people, ${A} like tea and ${B} like coffee${ask === "both" ? `, and ${none} like neither. How many like both?` : ask === "none" ? `, and ${both} like both. How many like neither?` : `, and ${both} like both. How many like only tea?`}`,
        answer: String(val),
        explanation: ask === "both"
          ? `|T∪C| = ${total} − ${none} = ${total - none}. Both = ${A} + ${B} − ${total - none} = ${both}.`
          : ask === "none"
          ? `|T∪C| = ${A} + ${B} − ${both} = ${A + B - both}. None = ${total} − ${A + B - both} = ${none}.`
          : `Only tea = ${A} − ${both} = ${onlyA}.` };
    },
    () => { // subsets
      const n = ri(4, 10);
      const ask = pick(["subsets", "proper subsets", "non-empty subsets"] as const);
      const base = Math.pow(2, n);
      const v = ask === "subsets" ? base : base - 1;
      const o = opts(v, [base, base - 1, base + 1].filter((x) => x !== v).concat([2 * n]));
      return { subject: "CAT_QA", type: "MCQ", topic: "Modern Maths", difficulty: "EASY",
        stem: `A set has ${n} elements. How many ${ask} does it have?`, ...o,
        explanation: `Subsets = 2^${n} = ${base}. ${ask !== "subsets" ? `${ask === "proper subsets" ? "Proper" : "Non-empty"} = ${base} − 1 = ${v}.` : ""}` };
    },
    () => { // recurrence
      const a1 = ri(1, 5); const mult = pick([2, 3]); const add = ri(1, 4);
      let v = a1; const steps: number[] = [a1];
      for (let i = 2; i <= 5; i++) { v = mult * v + add; steps.push(v); }
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Modern Maths", difficulty: "MEDIUM",
        stem: `A sequence satisfies a₁ = ${a1} and aₙ = ${mult}aₙ₋₁ + ${add} for n ≥ 2. Find a₅.`, answer: String(v),
        explanation: `Terms: ${steps.join(", ")} → a₅ = ${v}.` };
    },
    () => { // three-set inclusion-exclusion (consistent data)
      const abc = ri(3, 8);
      const ab = abc + ri(2, 6), bc = abc + ri(2, 6), ac = abc + ri(2, 6);
      const oa = ri(10, 30), ob = ri(10, 30), oc = ri(10, 25);
      const A = oa + (ab - abc) + (ac - abc) + abc;
      const B = ob + (ab - abc) + (bc - abc) + abc;
      const Cc = oc + (ac - abc) + (bc - abc) + abc;
      const union = oa + ob + oc + (ab - abc) + (bc - abc) + (ac - abc) + abc;
      const none = ri(5, 20);
      const total = union + none;
      return { subject: "CAT_QA", type: "SHORT_ANSWER", topic: "Modern Maths", difficulty: "HARD",
        stem: `In a survey of ${total} students: ${A} read magazine A, ${B} read B, ${Cc} read C; ${ab} read A&B, ${bc} read B&C, ${ac} read A&C; ${abc} read all three. How many read none?`,
        answer: String(none),
        explanation: `|A∪B∪C| = ${A}+${B}+${Cc} − ${ab} − ${bc} − ${ac} + ${abc} = ${union}. None = ${total} − ${union} = ${none}.` };
    },
  ],
};

function fact(n: number): number { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }
function C(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  let v = 1; for (let i = 0; i < r; i++) v = (v * (n - i)) / (i + 1);
  return Math.round(v);
}

// ── CAT_DILR set generators (passage + several questions) ────────────────────
type SetGen = () => GenQ[];

const NAMES = ["Aarav", "Bhavya", "Chirag", "Diya", "Esha", "Farhan", "Gauri", "Harsh", "Ishita", "Kabir", "Lakshya", "Meera", "Naina", "Omar", "Priya", "Rohan"];
const COMPANIES = ["Apex", "Bolt", "Crest", "Dune", "Ember", "Flux", "Grid", "Halo", "Iris", "Jade"];
const CITIES = ["Mumbai", "Delhi", "Pune", "Chennai", "Kolkata", "Jaipur", "Surat", "Indore"];

const DILR_GENS: SetGen[] = [
  // Data Tables — company revenues
  () => {
    const comps = shuffle([...COMPANIES]).slice(0, 4);
    const data = comps.map(() => [ri(50, 200), ri(50, 220), ri(50, 240)]);
    const passage = `The table shows quarterly revenue (Rs. crore) of four companies:\nCompany | Q1 | Q2 | Q3\n${comps.map((c, i) => `${c.padEnd(7)} | ${data[i][0]} | ${data[i][1]} | ${data[i][2]}`).join("\n")}`;
    const totals = data.map((d) => d[0] + d[1] + d[2]);
    const growth = data.map((d) => ((d[2] - d[0]) / d[0]) * 100);
    const tMax = Math.max(...totals), gMax = Math.max(...growth);
    if (totals.filter((t) => t === tMax).length > 1 || growth.filter((g) => g === gMax).length > 1) return [];
    const hiTotal = totals.indexOf(tMax);
    const hiGrowth = growth.indexOf(gMax);
    const q2sum = data.reduce((s, d) => s + d[1], 0);
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "MCQ", topic: "Data Tables", difficulty: "EASY", passage,
        stem: "Which company has the highest total revenue across the three quarters?",
        ...opts(comps[hiTotal], comps.filter((_, i) => i !== hiTotal)),
        explanation: `Totals: ${comps.map((c, i) => `${c}=${totals[i]}`).join(", ")}. Highest: ${comps[hiTotal]}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Data Tables", difficulty: "EASY", passage,
        stem: "What is the combined Q2 revenue (Rs. crore) of all four companies?",
        answer: String(q2sum), explanation: `${data.map((d) => d[1]).join(" + ")} = ${q2sum}.` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Data Tables", difficulty: "MEDIUM", passage,
        stem: "Which company recorded the highest percentage growth from Q1 to Q3?",
        ...opts(comps[hiGrowth], comps.filter((_, i) => i !== hiGrowth)),
        explanation: `Growth %: ${comps.map((c, i) => `${c}=${growth[i].toFixed(1)}%`).join(", ")}. Highest: ${comps[hiGrowth]}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Data Tables", difficulty: "MEDIUM", passage,
        stem: `What is the average quarterly revenue (Rs. crore) of ${comps[0]}? (Round to 2 decimals if needed.)`,
        answer: String(Math.round((totals[0] / 3) * 100) / 100),
        explanation: `${totals[0]}/3 = ${Math.round((totals[0] / 3) * 100) / 100}.` },
    ];
    return qs;
  },

  // Pie chart — budget split
  () => {
    let shares = [ri(20, 35), ri(15, 25), ri(10, 20), ri(8, 15)];
    const used = shares.reduce((a, b) => a + b, 0);
    if (used >= 95) return [];
    shares.push(100 - used);
    // The "how much more Rent than Savings" question presupposes Rent > Savings.
    if (shares[0] <= shares[4]) return [];
    const cats = ["Rent", "Food", "Education", "Transport", "Savings"];
    const total = pick([40000, 50000, 60000, 80000, 100000]);
    const passage = `A household's monthly budget of Rs.${total.toLocaleString("en-IN")} is split as:\n${cats.map((c, i) => `${c}: ${shares[i]}%`).join(", ")}.`;
    const amt = (i: number) => (total * shares[i]) / 100;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Pie Charts", difficulty: "EASY", passage,
        stem: `How much (in Rs.) is spent on ${cats[1]}?`, answer: String(amt(1)),
        explanation: `${shares[1]}% of ${total} = ${amt(1)}.` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Pie Charts", difficulty: "MEDIUM", passage,
        stem: `What is the combined spend (Rs.) on ${cats[0]} and ${cats[2]}?`,
        ...opts(amt(0) + amt(2), [amt(0) + amt(1), amt(2) + amt(3), amt(0)]),
        explanation: `(${shares[0]}% + ${shares[2]}%) of ${total} = ${amt(0) + amt(2)}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Pie Charts", difficulty: "MEDIUM", passage,
        stem: `How much more (in Rs.) goes to ${cats[0]} than to ${cats[4]}?`,
        answer: String(amt(0) - amt(4)),
        explanation: `${amt(0)} − ${amt(4)} = ${amt(0) - amt(4)}.` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Pie Charts", difficulty: "HARD", passage,
        stem: `If income rises 10% and the same percentage split is kept, by how much (Rs.) does the ${cats[0]} spend increase?`,
        ...opts(amt(0) / 10, [amt(0) / 5, amt(0), total / 10]),
        explanation: `New ${cats[0]} = ${shares[0]}% of ${total * 1.1} = ${amt(0) * 1.1}; increase = ${amt(0) / 10}.` },
    ];
    return qs;
  },

  // Round-robin tournament
  () => {
    const n = pick([4, 5, 6, 8, 10]);
    const matches = (n * (n - 1)) / 2;
    const passage = `In a round-robin tournament, each of the ${n} teams plays every other team exactly once. A win earns 2 points, a loss 0; there are no draws.`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "MCQ", topic: "Games & Tournaments", difficulty: "EASY", passage,
        stem: "How many matches are played in total?",
        ...opts(matches, [matches + n, matches - n + 1, n * (n - 1)]),
        explanation: `C(${n},2) = ${n}×${n - 1}/2 = ${matches}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Games & Tournaments", difficulty: "EASY", passage,
        stem: "What is the total number of points distributed across all teams?",
        answer: String(2 * matches), explanation: `Each match gives out exactly 2 points → 2×${matches} = ${2 * matches}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Games & Tournaments", difficulty: "MEDIUM", passage,
        stem: "What is the maximum number of points a single team can earn?",
        answer: String(2 * (n - 1)), explanation: `A team plays ${n - 1} matches; winning all gives 2×${n - 1} = ${2 * (n - 1)} points.` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Games & Tournaments", difficulty: "HARD", passage,
        stem: "If one team loses all its matches and another wins all its matches, how many points do the remaining teams share?",
        ...opts(2 * matches - 2 * (n - 1), [2 * matches, 2 * (n - 2), 2 * matches - (n - 1)]),
        explanation: `Total ${2 * matches} − winner's ${2 * (n - 1)} − loser's 0 = ${2 * matches - 2 * (n - 1)}.` },
    ];
    return qs;
  },

  // Knockout tournament
  () => {
    const n = pick([16, 32, 64, 128]);
    const passage = `A knockout (single-elimination) tournament begins with ${n} players. Each match eliminates exactly one player.`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "MCQ", topic: "Games & Tournaments", difficulty: "EASY", passage,
        stem: "How many matches are needed to crown the champion?",
        ...opts(n - 1, [n, n / 2, n + 1]),
        explanation: `${n - 1} players must be eliminated, one per match → ${n - 1} matches.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Games & Tournaments", difficulty: "EASY", passage,
        stem: "How many rounds does the tournament have?",
        answer: String(Math.log2(n)), explanation: `${n} = 2^${Math.log2(n)} → ${Math.log2(n)} rounds.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Games & Tournaments", difficulty: "MEDIUM", passage,
        stem: "How many matches does the eventual champion play?",
        answer: String(Math.log2(n)), explanation: `One match per round → ${Math.log2(n)} matches.` },
    ];
    return qs;
  },

  // Venn 2-set survey
  () => {
    const both = ri(10, 40);
    const onlyA = ri(20, 80); const onlyB = ri(20, 70); const none = ri(10, 50);
    const total = onlyA + onlyB + both + none;
    const A = onlyA + both, B = onlyB + both;
    const [pa, pb] = pick([["cricket", "football"], ["tea", "coffee"], ["Hindi films", "English films"], ["trains", "flights"]]);
    const passage = `In a survey of ${total} people: ${A} like ${pa}, ${B} like ${pb}, and ${both} like both.`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Venn Diagrams", difficulty: "EASY", passage,
        stem: `How many like only ${pa}?`, answer: String(onlyA), explanation: `${A} − ${both} = ${onlyA}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Venn Diagrams", difficulty: "MEDIUM", passage,
        stem: "How many like neither?", answer: String(none),
        explanation: `|A∪B| = ${A}+${B}−${both} = ${A + B - both}; neither = ${total} − ${A + B - both} = ${none}.` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Venn Diagrams", difficulty: "MEDIUM", passage,
        stem: `How many like exactly one of ${pa} and ${pb}?`,
        ...opts(onlyA + onlyB, [A + B, onlyA + onlyB + both, total - both]),
        explanation: `Only ${pa} (${onlyA}) + only ${pb} (${onlyB}) = ${onlyA + onlyB}.` },
    ];
    return qs;
  },

  // Venn 3-set survey (built from disjoint regions → always consistent)
  () => {
    const abc = ri(4, 10);
    const abO = ri(5, 15), bcO = ri(5, 15), acO = ri(5, 15); // pairwise-only
    const aO = ri(15, 40), bO = ri(15, 40), cO = ri(10, 35);
    const none = ri(5, 30);
    const total = abc + abO + bcO + acO + aO + bO + cO + none;
    const A = aO + abO + acO + abc, B = bO + abO + bcO + abc, Cs = cO + acO + bcO + abc;
    const AB = abO + abc, BC = bcO + abc, AC = acO + abc;
    const passage = `In a colony of ${total} residents: ${A} read newspaper X, ${B} read Y, ${Cs} read Z; ${AB} read X&Y, ${BC} read Y&Z, ${AC} read X&Z; ${abc} read all three.`;
    const union = total - none;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Venn Diagrams", difficulty: "MEDIUM", passage,
        stem: "How many residents read none of the three newspapers?",
        answer: String(none),
        explanation: `|X∪Y∪Z| = ${A}+${B}+${Cs}−${AB}−${BC}−${AC}+${abc} = ${union}. None = ${total} − ${union} = ${none}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Venn Diagrams", difficulty: "HARD", passage,
        stem: "How many read exactly one newspaper?",
        answer: String(aO + bO + cO),
        explanation: `Only X = ${aO}, only Y = ${bO}, only Z = ${cO} → ${aO + bO + cO}.` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Venn Diagrams", difficulty: "HARD", passage,
        stem: "How many read exactly two newspapers?",
        ...opts(abO + bcO + acO, [AB + BC + AC, abO + bcO + acO + abc, AB + BC + AC - abc]),
        explanation: `Pairwise-only regions: (${AB}−${abc}) + (${BC}−${abc}) + (${AC}−${abc}) = ${abO + bcO + acO}.` },
    ];
    return qs;
  },

  // Linear seating
  () => {
    const n = 5;
    const people = shuffle([...NAMES]).slice(0, n);
    const order = shuffle([...people]); // ground truth left→right
    const posOf = (p: string) => order.indexOf(p) + 1;
    const [P0, P1, P2, P3, P4] = order;
    const clues = [
      `${P0} is at the extreme left.`,
      `${P2} is exactly in the middle.`,
      `${P1} is to the immediate right of ${P0}.`,
      `${P4} is at the extreme right.`,
    ];
    const passage = `Five friends — ${people.join(", ")} — sit in a row facing north. ${clues.join(" ")}`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "MCQ", topic: "Seating Arrangements", difficulty: "MEDIUM", passage,
        stem: `Who sits at position 4 (from the left)?`,
        ...opts(order[3], order.filter((p) => p !== order[3]).slice(0, 3)),
        explanation: `Order: ${order.join(", ")}. Position 4 = ${order[3]}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Seating Arrangements", difficulty: "MEDIUM", passage,
        stem: `How many people sit between ${P0} and ${P4}?`,
        answer: String(Math.abs(posOf(P4) - posOf(P0)) - 1),
        explanation: `Positions ${posOf(P0)} and ${posOf(P4)} → ${Math.abs(posOf(P4) - posOf(P0)) - 1} between.` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Seating Arrangements", difficulty: "EASY", passage,
        stem: `Who is to the immediate left of ${P2}?`,
        ...opts(order[1], order.filter((p) => p !== order[1]).slice(0, 3)),
        explanation: `${P2} is at position 3; immediate left = position 2 = ${order[1]}.` },
    ];
    return qs;
  },

  // Circular seating (8 people, fixed facts)
  () => {
    const people = shuffle([...NAMES]).slice(0, 6);
    const order = shuffle([...people]); // clockwise ground truth
    const idx = (p: string) => order.indexOf(p);
    const right = (p: string) => order[(idx(p) + 1) % 6]; // immediate right when facing centre = anticlockwise neighbour; keep simple: define right = next clockwise
    const opp = (p: string) => order[(idx(p) + 3) % 6];
    const passage = `Six colleagues — ${people.join(", ")} — sit around a circular table, all facing the centre. Going clockwise from ${order[0]}, the order is: ${order.join(" → ")}.`;
    const target = pick(people);
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "MCQ", topic: "Seating Arrangements", difficulty: "EASY", passage,
        stem: `Who sits directly opposite ${target}?`,
        ...opts(opp(target), people.filter((p) => p !== opp(target) && p !== target).slice(0, 3)),
        explanation: `In a 6-seat circle, opposite = 3 positions away clockwise: ${opp(target)}.` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Seating Arrangements", difficulty: "MEDIUM", passage,
        stem: `Who is the immediate clockwise neighbour of ${target}?`,
        ...opts(right(target), people.filter((p) => p !== right(target) && p !== target).slice(0, 3)),
        explanation: `Next clockwise after ${target}: ${right(target)}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Seating Arrangements", difficulty: "MEDIUM", passage,
        stem: `Counting clockwise, how many people sit between ${order[0]} and ${order[3]}?`,
        answer: "2",
        explanation: `Clockwise from ${order[0]} to ${order[3]}: ${order[1]}, ${order[2]} → 2 people.` },
    ];
    return qs;
  },

  // Bar graph — production
  () => {
    const facs = ["X", "Y", "Z"];
    const years = [2022, 2023, 2024];
    const data = facs.map(() => { const base = ri(30, 80); return [base, base + ri(-10, 20), base + ri(-5, 30)]; });
    const passage = `Production (thousand units) of three factories:\n${years.map((y, j) => `${y}: ${facs.map((f, i) => `${f}=${data[i][j]}`).join(", ")}`).join("\n")}`;
    const avg = (i: number) => (data[i][0] + data[i][1] + data[i][2]) / 3;
    const growth = (i: number) => ((data[i][2] - data[i][0]) / data[i][0]) * 100;
    const gvals = facs.map((_, i) => growth(i));
    const gmax = Math.max(...gvals);
    if (gvals.filter((g) => g === gmax).length > 1) return []; // tie → ambiguous MCQ
    const hi = gvals.indexOf(gmax);
    const yTotals = years.map((_, j) => data.reduce((s, d) => s + d[j], 0));
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Bar Graphs", difficulty: "EASY", passage,
        stem: `What is factory Y's average annual production (thousand units)? (Round to 2 decimals if needed.)`,
        answer: String(Math.round(avg(1) * 100) / 100),
        explanation: `(${data[1].join("+")})/3 = ${Math.round(avg(1) * 100) / 100}.` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Bar Graphs", difficulty: "MEDIUM", passage,
        stem: `Which factory grew the most (in % terms) from ${years[0]} to ${years[2]}?`,
        ...opts(facs[hi], facs.filter((_, i) => i !== hi).concat(["All equal"])),
        explanation: `Growth: ${facs.map((f, i) => `${f}=${gvals[i].toFixed(1)}%`).join(", ")} → ${facs[hi]}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Bar Graphs", difficulty: "MEDIUM", passage,
        stem: `What was the total production (thousand units) across all factories in ${years[2]}?`,
        answer: String(yTotals[2]),
        explanation: `${data.map((d) => d[2]).join(" + ")} = ${yTotals[2]}.` },
    ];
    return qs;
  },

  // Line graph — temperature/profit
  () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const vals = [ri(15, 25)];
    for (let i = 1; i < 7; i++) vals.push(vals[i - 1] + ri(-4, 5));
    const passage = `Daily maximum temperature (°C): ${days.map((d, i) => `${d}: ${vals[i]}`).join(", ")}.`;
    const diffs = vals.slice(1).map((v, i) => v - vals[i]);
    const maxRise = Math.max(...diffs);
    // Tied max rises make "rose the most" ambiguous; no rise at all makes it unanswerable.
    if (maxRise <= 0 || diffs.filter((d) => d === maxRise).length > 1) return [];
    const riseDay = days[diffs.indexOf(maxRise) + 1];
    const range = Math.max(...vals) - Math.min(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / 7;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "MCQ", topic: "Line Graphs", difficulty: "MEDIUM", passage,
        stem: "On which day did the temperature rise the most compared to the previous day?",
        ...opts(riseDay, days.filter((d) => d !== riseDay && d !== "Mon").slice(0, 3)),
        explanation: `Day-on-day changes: ${diffs.map((d, i) => `${days[i + 1]}: ${d > 0 ? "+" : ""}${d}`).join(", ")}. Biggest rise: ${riseDay} (+${maxRise}).` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Line Graphs", difficulty: "EASY", passage,
        stem: "What is the range (max − min) of the temperatures?",
        answer: String(range), explanation: `Max ${Math.max(...vals)} − min ${Math.min(...vals)} = ${range}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Line Graphs", difficulty: "MEDIUM", passage,
        stem: "What is the average temperature (°C) over the week? (Round to 2 decimals.)",
        answer: String(Math.round(avg * 100) / 100),
        explanation: `Sum ${vals.reduce((a, b) => a + b, 0)}/7 = ${Math.round(avg * 100) / 100}.` },
    ];
    return qs;
  },

  // Caselet — exam scoring
  () => {
    const totalQ = pick([40, 50, 60, 75, 100]);
    const attempted = totalQ - ri(5, 15);
    const correct = ri(Math.floor(attempted * 0.5), attempted - 3);
    const wrong = attempted - correct;
    const score = correct * pick([1, 2, 3]) - wrong * 1;
    const mk = score >= 0 ? (correct * 3 - wrong) : 0; // recompute with fixed +3/−1
    const s3 = correct * 3 - wrong;
    const passage = `A test has ${totalQ} questions (+3 for a correct answer, −1 for a wrong answer, 0 for skips). A student attempts ${attempted} questions, answering ${correct} correctly.`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Caselets", difficulty: "EASY", passage,
        stem: "How many questions did the student answer wrongly?",
        answer: String(wrong), explanation: `${attempted} attempted − ${correct} correct = ${wrong} wrong.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Caselets", difficulty: "MEDIUM", passage,
        stem: "What is the student's total score?",
        answer: String(s3), explanation: `${correct}×3 − ${wrong}×1 = ${correct * 3} − ${wrong} = ${s3}.` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Caselets", difficulty: "MEDIUM", passage,
        stem: "What is the maximum possible score on this test?",
        ...opts(totalQ * 3, [totalQ * 3 - totalQ, attempted * 3, totalQ * 2]),
        explanation: `All ${totalQ} correct → ${totalQ}×3 = ${totalQ * 3}.` },
    ];
    return qs;
  },

  // Routes & Networks — grid paths + weighted shortest path
  () => {
    const m = ri(2, 4); const n2 = ri(2, 4);
    const paths = C(m + n2, m);
    const passage = `A delivery robot moves on a city grid from the top-left corner to the bottom-right corner of an ${m}×${n2} block grid. It can move only right or down along grid lines.`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "MCQ", topic: "Routes & Networks", difficulty: "MEDIUM", passage,
        stem: "How many distinct shortest routes are there?",
        ...opts(paths, [paths + m, paths - n2, C(m + n2, m) * 2]),
        explanation: `It needs ${m} downs and ${n2} rights in some order: C(${m + n2},${m}) = ${paths}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Routes & Networks", difficulty: "EASY", passage,
        stem: "How many moves does each shortest route contain?",
        answer: String(m + n2), explanation: `${m} downs + ${n2} rights = ${m + n2} moves.` },
    ];
    return qs;
  },

  // Weighted network shortest path
  () => {
    const ab = ri(2, 8), bd = ri(2, 8), ac = ri(3, 9), cd = ri(2, 8), de = ri(3, 9), be = ri(8, 18);
    const viaB = ab + bd + de, viaC = ac + cd + de, direct = ab + be;
    const best = Math.min(viaB, viaC, direct);
    const passage = `A road network connects five towns: A–B (${ab} km), B–D (${bd} km), A–C (${ac} km), C–D (${cd} km), D–E (${de} km), B–E (${be} km). No other direct roads exist.`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Routes & Networks", difficulty: "MEDIUM", passage,
        stem: "What is the shortest distance (km) from A to E?",
        answer: String(best),
        explanation: `A–B–D–E = ${viaB}; A–C–D–E = ${viaC}; A–B–E = ${direct}. Shortest = ${best}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Routes & Networks", difficulty: "EASY", passage,
        stem: "What is the shortest distance (km) from A to D?",
        answer: String(Math.min(ab + bd, ac + cd)),
        explanation: `A–B–D = ${ab + bd}; A–C–D = ${ac + cd}. Shortest = ${Math.min(ab + bd, ac + cd)}.` },
    ];
    return qs;
  },

  // Binary logic — knights & knaves (2 people, X says both knaves)
  () => {
    const [x, y] = shuffle([...NAMES]).slice(0, 2);
    const passage = `On an island, knights always tell the truth and knaves always lie. You meet ${x} and ${y}. ${x} says: "We are both knaves." ${y} stays silent.`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "MCQ", topic: "Binary Logic", difficulty: "MEDIUM", passage,
        stem: `What are ${x} and ${y}, respectively?`,
        ...opts(`${x}: knave, ${y}: knight`, [`${x}: knight, ${y}: knave`, `both knights`, `both knaves`]),
        explanation: `If ${x} were a knight, "both knaves" would be true — contradiction. So ${x} is a knave, and the statement is false → not both are knaves → ${y} is a knight.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Binary Logic", difficulty: "EASY", passage,
        stem: "How many of the two are knights?",
        answer: "1", explanation: `${y} alone is a knight (see the contradiction argument).` },
    ];
    return qs;
  },

  // Coding language (word-intersection)
  () => {
    const codewords = shuffle(["fruit", "sweet", "red", "small", "sour", "green", "yellow", "fresh"]).slice(0, 5);
    const words = shuffle(["apple", "mango", "grape", "cherry", "lemon"]).slice(0, 5);
    // sentence1: w0 w1 w2 → c0 c1 c2 ; sentence2: w1 w3 → c1 c3 ; sentence3: w2 w4 → c2 c4
    const passage = `In a code language: "${words[0]} ${words[1]} ${words[2]}" means "${codewords[0]} ${codewords[1]} ${codewords[2]}"; "${words[1]} ${words[3]}" means "${codewords[1]} ${codewords[3]}"; "${words[2]} ${words[4]}" means "${codewords[2]} ${codewords[4]}".`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "MCQ", topic: "Binary Logic", difficulty: "MEDIUM", passage,
        stem: `What does "${words[1]}" mean in the code?`,
        ...opts(codewords[1], [codewords[0], codewords[2], codewords[3]]),
        explanation: `"${words[1]}" appears in sentences 1 and 2; the common code word is "${codewords[1]}".` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Binary Logic", difficulty: "MEDIUM", passage,
        stem: `What does "${words[2]}" mean in the code?`,
        ...opts(codewords[2], [codewords[1], codewords[4], codewords[0]]),
        explanation: `"${words[2]}" appears in sentences 1 and 3; the common code word is "${codewords[2]}".` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Binary Logic", difficulty: "EASY", passage,
        stem: `What does "${words[0]}" mean in the code?`,
        ...opts(codewords[0], [codewords[1], codewords[2], codewords[3]]),
        explanation: `In sentence 1, "${words[1]}"="${codewords[1]}" and "${words[2]}"="${codewords[2]}" are known, leaving "${words[0]}"="${codewords[0]}".` },
    ];
    return qs;
  },

  // Scheduling — lectures across a week
  () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const subjects = shuffle(["Maths", "Physics", "Chemistry", "Biology", "History"]);
    const passage = `Five lectures — ${[...subjects].sort().join(", ")} — are scheduled Monday to Friday, one per day. ${subjects[2]} is on Wednesday. ${subjects[0]} is the first lecture of the week. ${subjects[4]} is on Friday. ${subjects[1]} is the day after ${subjects[0]}.`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "MCQ", topic: "Scheduling & Sequencing", difficulty: "MEDIUM", passage,
        stem: `On which day is ${subjects[3]}?`,
        ...opts("Thursday", ["Tuesday", "Wednesday", "Friday"]),
        explanation: `${subjects[0]}=Mon, ${subjects[1]}=Tue, ${subjects[2]}=Wed, ${subjects[4]}=Fri → ${subjects[3]} takes Thursday.` },
      { subject: "CAT_DILR", type: "MCQ", topic: "Scheduling & Sequencing", difficulty: "EASY", passage,
        stem: `Which lecture is on Tuesday?`,
        ...opts(subjects[1], [subjects[0], subjects[3], subjects[4]]),
        explanation: `${subjects[1]} is the day after ${subjects[0]} (Monday) → Tuesday.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Scheduling & Sequencing", difficulty: "MEDIUM", passage,
        stem: `How many lectures happen after ${subjects[2]} (i.e., later in the week)?`,
        answer: "2", explanation: `${subjects[2]} is Wednesday; Thursday (${subjects[3]}) and Friday (${subjects[4]}) come after → 2.` },
    ];
    return qs;
  },

  // Grid / matrix puzzle — mini sudoku row/col reasoning
  () => {
    // 3×3 latin square on {1,2,3}
    const perms = [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]];
    const r1 = pick(perms);
    const shifts = shuffle([[0,1,2],[0,2,1]])[0];
    const grid = [r1, r1.map((_, i) => r1[(i + shifts[1]) % 3]), r1.map((_, i) => r1[(i + shifts[2]) % 3])];
    // verify latin: columns distinct
    for (let c = 0; c < 3; c++) { const col = [grid[0][c], grid[1][c], grid[2][c]]; if (new Set(col).size !== 3) return []; }
    const passage = `A 3×3 grid must contain the digits 1, 2, 3 exactly once in every row and every column. Row 1 is: ${grid[0].join(", ")}. The first cell of Row 2 is ${grid[1][0]}.`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Grid & Matrix Puzzles", difficulty: "MEDIUM", passage,
        stem: "What digit goes in Row 2, Column 2?",
        answer: String(grid[1][1]),
        explanation: `Row 2 starts with ${grid[1][0]}; with row 1 = ${grid[0].join(",")} and column constraints, Row 2 must be ${grid[1].join(",")} → cell (2,2) = ${grid[1][1]}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Grid & Matrix Puzzles", difficulty: "MEDIUM", passage,
        stem: "What digit goes in Row 3, Column 3?",
        answer: String(grid[2][2]),
        explanation: `Completing the Latin square: Row 3 = ${grid[2].join(",")} → cell (3,3) = ${grid[2][2]}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Grid & Matrix Puzzles", difficulty: "EASY", passage,
        stem: "What is the sum of the numbers on the main diagonal (top-left to bottom-right)?",
        answer: String(grid[0][0] + grid[1][1] + grid[2][2]),
        explanation: `${grid[0][0]} + ${grid[1][1]} + ${grid[2][2]} = ${grid[0][0] + grid[1][1] + grid[2][2]}.` },
    ];
    return qs;
  },

  // Caselet — vehicle ownership
  () => {
    const both = ri(15, 40);
    const carOnly = ri(20, 60), bikeOnly = ri(20, 60);
    const none = ri(0, 30);
    const total = both + carOnly + bikeOnly + none;
    const car = carOnly + both, bike = bikeOnly + both;
    const passage = `In a locality of ${total} families: ${car} own a car, ${bike} own a two-wheeler, and ${both} own both.${none === 0 ? " Every family owns at least one vehicle." : ""}`;
    const qs: GenQ[] = [
      { subject: "CAT_DILR", type: "MCQ", topic: "Caselets", difficulty: "EASY", passage,
        stem: "How many families own only a car?",
        ...opts(carOnly, [car, carOnly + both, car - bike > 0 ? car - bike : carOnly + 5]),
        explanation: `${car} − ${both} = ${carOnly}.` },
      { subject: "CAT_DILR", type: "SHORT_ANSWER", topic: "Caselets", difficulty: "MEDIUM", passage,
        stem: "How many families own neither vehicle?",
        answer: String(none),
        explanation: `At least one = ${car}+${bike}−${both} = ${car + bike - both}; neither = ${total} − ${car + bike - both} = ${none}.` },
    ];
    return qs;
  },
];

// ── CAT_VARC generators ──────────────────────────────────────────────────────
// Odd-one-out: theme banks — 4 sentences on one theme + 1 intruder. Answer computed.
const THEMES: { name: string; sentences: string[] }[] = [
  { name: "renewable energy", sentences: [
    "Solar panel costs have fallen more than 80% over the past decade, making photovoltaics the cheapest electricity source in many regions.",
    "Wind turbines now supply a double-digit share of electricity in several European grids.",
    "Grid-scale battery storage is the missing piece that lets intermittent renewables replace baseload plants.",
    "Government subsidies for rooftop solar have accelerated household adoption in emerging markets.",
    "Hydroelectric dams, though renewable, raise their own ecological concerns about river ecosystems.",
  ]},
  { name: "the gig economy", sentences: [
    "App-based platforms match millions of freelance workers to short-term tasks every day.",
    "Gig workers typically lack the health insurance and paid leave that formal employees receive.",
    "Courts in several countries are re-examining whether ride-hailing drivers are contractors or employees.",
    "Flexible scheduling is the most cited reason workers give for preferring gig work.",
    "Labour unions are experimenting with new membership models designed for platform workers.",
  ]},
  { name: "space exploration", sentences: [
    "Reusable rockets have cut the cost of reaching low-earth orbit by an order of magnitude.",
    "Private companies now ferry both cargo and astronauts to the International Space Station.",
    "Lunar missions are being planned as staging grounds for eventual crewed voyages to Mars.",
    "Satellite mega-constellations promise global broadband but worry astronomers.",
    "Space agencies are studying how long-duration missions affect the human body.",
  ]},
  { name: "artificial intelligence", sentences: [
    "Large language models can draft essays, write code, and summarise documents with striking fluency.",
    "Concerns about algorithmic bias have prompted calls for mandatory AI audits.",
    "Training frontier AI models requires computing clusters that consume megawatts of power.",
    "Several governments are drafting regulation to classify AI systems by risk level.",
    "AI-assisted diagnosis is beginning to match specialist accuracy in radiology.",
  ]},
  { name: "ocean conservation", sentences: [
    "Plastic debris has been found in the deepest ocean trenches on Earth.",
    "Overfishing has pushed a third of assessed fish stocks beyond sustainable limits.",
    "Coral reefs are bleaching at unprecedented rates as sea temperatures climb.",
    "Marine protected areas allow fish populations to recover and spill over into fishing zones.",
    "Coastal mangroves store several times more carbon per hectare than tropical forests.",
  ]},
  { name: "urban transportation", sentences: [
    "Dedicated bus corridors move more commuters per hour than mixed traffic lanes.",
    "Cycling infrastructure investment pays for itself through reduced healthcare costs.",
    "Congestion pricing in city centres has cut traffic and funded public transit upgrades.",
    "Metro networks reshape property prices along their corridors within a few years.",
    "Electric scooter sharing schemes have forced cities to rethink kerbside regulation.",
  ]},
  { name: "the history of printing", sentences: [
    "Gutenberg's movable type dramatically lowered the cost of reproducing texts in Europe.",
    "Cheap printed pamphlets fuelled the rapid spread of Reformation ideas.",
    "Print standardised vernacular languages by fixing spelling and grammar in ink.",
    "The penny press of the nineteenth century made daily news affordable to workers.",
    "Offset lithography enabled the mass-market paperback boom of the twentieth century.",
  ]},
  { name: "vaccination", sentences: [
    "Vaccines train the immune system to recognise pathogens before a real infection occurs.",
    "Herd immunity protects those who cannot be vaccinated, such as newborns and the immunocompromised.",
    "Cold-chain logistics remain the biggest obstacle to vaccine delivery in remote regions.",
    "mRNA technology allows new vaccines to be designed within weeks of sequencing a pathogen.",
    "Smallpox remains the only human disease eradicated entirely through vaccination.",
  ]},
  { name: "behavioural economics", sentences: [
    "People systematically overvalue immediate rewards relative to larger future payoffs.",
    "Default options powerfully shape choices, from organ donation to retirement savings.",
    "Loss aversion means the pain of losing money outweighs the pleasure of gaining the same amount.",
    "Framing the same information differently can reverse people's stated preferences.",
    "Field experiments show that small, timely reminders significantly improve loan repayment rates.",
  ]},
  { name: "the microbiome", sentences: [
    "Trillions of bacteria in the human gut help digest food and synthesise vitamins.",
    "Antibiotic overuse can disrupt gut flora for months after treatment ends.",
    "Microbial diversity in early childhood is linked to lower rates of allergy and asthma.",
    "Faecal transplants have proved remarkably effective against recurrent C. difficile infection.",
    "Diets rich in fibre feed beneficial bacteria that produce anti-inflammatory compounds.",
  ]},
];

function genOddOneOut(): GenQ | null {
  const [main, intruderTheme] = shuffle([...THEMES]).slice(0, 2);
  const four = shuffle([...main.sentences]).slice(0, 4);
  const intruder = pick(intruderTheme.sentences);
  const arranged = shuffle([...four, intruder]);
  const pos = arranged.indexOf(intruder) + 1;
  return {
    subject: "CAT_VARC", type: "SHORT_ANSWER", topic: "Odd One Out", difficulty: "MEDIUM",
    stem: `Five sentences are given. Four form a coherent group on one theme; one does not belong. Type the number of the odd sentence out.\n${arranged.map((s, i) => `(${i + 1}) ${s}`).join("\n")}`,
    answer: String(pos),
    explanation: `Sentences ${arranged.map((s, i) => (s === intruder ? null : i + 1)).filter(Boolean).join(", ")} all discuss ${main.name}. Sentence ${pos} is about ${intruderTheme.name}, so it is the odd one out.`,
  };
}

// Critical reasoning: scenario bank with computed-correct structures.
const CR_SCENARIOS = [
  {
    claim: "A city installed more streetlights and burglaries fell 20%; therefore streetlights reduce burglaries",
    weaken: "During the same period, the city also doubled night-time police patrols in the affected areas",
    strengthen: "Neighbourhoods that received no new streetlights saw burglary rates stay flat over the same period",
    assumption: "No other major crime-prevention initiative was introduced in the same period",
    distractors: ["The streetlights use energy-efficient LED technology", "Burglars typically operate in groups of two or three", "The city plans to install even more streetlights next year"],
  },
  {
    claim: "Employees who take regular vacations are more productive; therefore the firm should mandate minimum vacation days",
    weaken: "Highly productive employees are the ones most able to take vacations without falling behind, so productivity may drive vacations rather than the reverse",
    strengthen: "A randomised pilot in which employees were assigned mandatory leave showed a rise in output afterwards",
    assumption: "Vacation time is a cause of productivity rather than merely a correlate of it",
    distractors: ["The firm's competitors offer unlimited vacation policies", "Vacations are more expensive during the holiday season", "Some employees prefer to accumulate leave for long trips"],
  },
  {
    claim: "Students who eat breakfast score higher on tests; therefore schools should provide free breakfast to raise scores",
    weaken: "Families that provide breakfast also tend to provide tutoring and quiet study space, which may explain the higher scores",
    strengthen: "In schools that piloted free breakfast, scores rose among students who previously skipped breakfast, while other students' scores were unchanged",
    assumption: "The link between breakfast and test scores is causal, not just correlational",
    distractors: ["Test scores also vary with the day of the week", "Breakfast foods vary widely in nutritional value", "Some students dislike eating early in the morning"],
  },
  {
    claim: "Since the new manager arrived, the branch's sales have risen; therefore the manager caused the increase",
    weaken: "The rise coincided with a nationwide festival season during which all branches recorded similar gains",
    strengthen: "Sales rose only in the departments the new manager directly restructured, and not elsewhere in the branch",
    assumption: "No seasonal or market-wide factor fully accounts for the sales increase",
    distractors: ["The manager previously worked at a competitor firm", "The branch is located in a busy commercial district", "Sales figures are audited quarterly by an external firm"],
  },
  {
    claim: "Countries with more chocolate consumption win more Nobel Prizes; therefore chocolate boosts scientific achievement",
    weaken: "National wealth predicts both chocolate consumption and research funding, explaining the correlation without any causal link",
    strengthen: "Controlled studies show a specific compound in cocoa measurably improves the cognitive functions used in research work",
    assumption: "The correlation is not produced by a third factor that drives both variables",
    distractors: ["Chocolate consumption is measured per capita in the study", "Nobel Prizes are awarded across six different categories", "Some laureates report disliking sweets"],
  },
  {
    claim: "Our app's users who enable notifications spend twice as long in the app; therefore we should enable notifications for everyone by default",
    weaken: "Users who enable notifications are the most engaged fans to begin with, and forcing notifications on others may drive them to uninstall",
    strengthen: "In an A/B test, randomly selected users given default-on notifications increased usage without higher uninstall rates",
    assumption: "The engagement gap is caused by notifications rather than by pre-existing differences between user groups",
    distractors: ["The app is available on both Android and iOS", "Notifications can be customised by category", "Session length is measured in minutes per day"],
  },
  {
    claim: "Hospitals with more nurses per patient have lower mortality; therefore mandating higher nurse ratios will save lives",
    weaken: "Wealthier hospitals afford both more nurses and better equipment, and the equipment may be what lowers mortality",
    strengthen: "When one state mandated minimum ratios, its hospitals' mortality fell relative to neighbouring states with similar equipment budgets",
    assumption: "Nurse staffing itself, rather than correlated hospital resources, drives the difference in mortality",
    distractors: ["Nursing qualifications vary across countries", "Hospital mortality statistics are published annually", "Some hospitals specialise in high-risk procedures"],
  },
  {
    claim: "Cities that added bike lanes saw retail sales rise on those streets; therefore bike lanes are good for local business",
    weaken: "The bike lanes were added mainly on streets already slated for broader redevelopment that attracted new shops",
    strengthen: "Comparable streets in the same cities without bike lanes saw no sales growth over the same period",
    assumption: "The sales increase was not driven by other simultaneous changes to those streets",
    distractors: ["Cycling is more common in summer months", "Retail sales data comes from card transactions", "Some cyclists also own cars"],
  },
];

function genCriticalReasoning(): GenQ | null {
  const sc = pick(CR_SCENARIOS);
  const kind = pick(["weaken", "strengthen", "assumption"] as const);
  const correct = sc[kind];
  const wrongPool = shuffle([...sc.distractors, ...(kind !== "weaken" ? [sc.weaken] : []), ...(kind !== "strengthen" ? [sc.strengthen] : [])]).slice(0, 3);
  const options = shuffle([correct, ...wrongPool]);
  const ask = kind === "weaken"
    ? "Which of the following, if true, would most WEAKEN the argument?"
    : kind === "strengthen"
    ? "Which of the following, if true, would most STRENGTHEN the argument?"
    : "Which of the following is an assumption on which the argument depends?";
  return {
    subject: "CAT_VARC", type: "MCQ", topic: "Critical Reasoning", difficulty: "HARD",
    stem: `Argument: "${sc.claim}." ${ask}`,
    options,
    answer: correct,
    explanation: kind === "weaken"
      ? `The correct option supplies an alternative explanation or undermines the causal link, weakening the conclusion. The other options are irrelevant details or would strengthen it.`
      : kind === "strengthen"
      ? `The correct option adds evidence isolating the claimed cause (e.g., a control comparison), strengthening the conclusion. The others are irrelevant or weaken it.`
      : `Negate the correct option and the argument collapses — that is the test for a required assumption. The other options are not necessary for the conclusion.`,
  };
}

// ── Generation loop ──────────────────────────────────────────────────────────
async function main() {
  const TARGETS = { QA_PER_TOPIC: 95, DILR_SETS: 400, VARC_ODD: 200, VARC_CR: 120 };

  // Dedup key = stem + passage: DILR sets reuse stems over different data.
  const key = (stem: string, passage?: string | null) => stem + "||" + (passage ?? "");
  const existingRows = await prisma.question.findMany({ select: { stem: true, passage: true } });
  const seen = new Set(existingRows.map((r) => key(r.stem, r.passage)));
  const out: GenQ[] = [];
  const push = (q: GenQ | null) => {
    if (!q) return false;
    const k = key(q.stem, q.passage);
    if (seen.has(k)) return false;
    seen.add(k); out.push(q); return true;
  };

  // QA
  for (const [topic, tpls] of Object.entries(QA_TPLS)) {
    let added = 0, attempts = 0;
    while (added < TARGETS.QA_PER_TOPIC && attempts < TARGETS.QA_PER_TOPIC * 60) {
      attempts++;
      if (push(pick(tpls)())) added++;
    }
    console.log(`QA / ${topic}: ${added}`);
  }

  // DILR
  let dilrCount = 0;
  for (let s = 0; s < TARGETS.DILR_SETS; s++) {
    const gen = DILR_GENS[s % DILR_GENS.length];
    const qs = gen();
    for (const q of qs) if (push(q)) dilrCount++;
  }
  console.log(`DILR total: ${dilrCount}`);

  // VARC
  let odd = 0, tries = 0;
  while (odd < TARGETS.VARC_ODD && tries < TARGETS.VARC_ODD * 40) { tries++; if (push(genOddOneOut())) odd++; }
  let cr = 0; tries = 0;
  while (cr < TARGETS.VARC_CR && tries < TARGETS.VARC_CR * 60) { tries++; if (push(genCriticalReasoning())) cr++; }
  console.log(`VARC odd-one-out: ${odd}, critical reasoning: ${cr}`);

  console.log(`\nGenerated ${out.length} unique questions. Inserting…`);

  // Insert in chunks
  const CHUNK = 100;
  for (let i = 0; i < out.length; i += CHUNK) {
    const chunk = out.slice(i, i + CHUNK);
    await prisma.question.createMany({
      data: chunk.map((q) => ({
        subject: q.subject, type: q.type, topic: q.topic, difficulty: q.difficulty,
        stem: q.stem, passage: q.passage ?? null,
        options: q.options ? JSON.stringify(q.options) : null,
        answer: q.answer, explanation: q.explanation,
      })),
    });
    process.stdout.write(`\r${Math.min(i + CHUNK, out.length)}/${out.length} inserted`);
  }

  const total = await prisma.question.count();
  const bySubj = await prisma.question.groupBy({ by: ["subject"], _count: true, where: { subject: { in: ["CAT_QA", "CAT_VARC", "CAT_DILR"] } } });
  console.log(`\n\nDone. DB total: ${total}`);
  for (const s of bySubj) console.log(`  ${s.subject}: ${s._count}`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
