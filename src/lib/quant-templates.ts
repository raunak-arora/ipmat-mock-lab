import type { GeneratedQuestion } from "./gemini";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mcqOptions(correct: number, wrong: number[]): string[] {
  return shuffle([String(correct), ...wrong.slice(0, 3).map(String)]);
}

type Template = () => GeneratedQuestion;

const PERCENTAGE_TEMPLATES: Template[] = [
  () => {
    const pct = pick([15, 20, 25, 30, 40, 45, 60, 75]);
    const result = pick([30, 45, 60, 75, 90, 120, 150, 180]);
    const x = result / (pct / 100);
    return {
      stem: `If ${pct}% of a number is ${result}, find the number.`,
      options: mcqOptions(x, [x + 10, x - 10, x + 20]),
      answer: String(x),
      explanation: `${pct}% of X = ${result} → X = ${result} × 100/${pct} = ${x}.`,
    };
  },
  () => {
    const orig = pick([500, 800, 1000, 1200, 1500, 2000]);
    const pctInc = pick([10, 15, 20, 25, 30]);
    const final = orig + (orig * pctInc) / 100;
    return {
      stem: `A price of Rs.${orig} increases by ${pctInc}%. What is the new price?`,
      options: mcqOptions(final, [final + 50, final - 50, orig]),
      answer: String(final),
      explanation: `Increase = ${pctInc}% of ${orig} = ${(orig * pctInc) / 100}. New price = ${orig} + ${(orig * pctInc) / 100} = Rs.${final}.`,
    };
  },
];

const RATIO_TEMPLATES: Template[] = [
  () => {
    const a = pick([2, 3, 4, 5]);
    const b = pick([3, 4, 5, 7]);
    const total = pick([70, 90, 100, 120, 140, 180]);
    const shareA = Math.round((a / (a + b)) * total);
    const shareB = total - shareA;
    return {
      stem: `Two numbers are in the ratio ${a}:${b}. Their sum is ${total}. Find the larger number.`,
      options: mcqOptions(Math.max(shareA, shareB), [
        Math.min(shareA, shareB),
        Math.max(shareA, shareB) + 5,
        Math.max(shareA, shareB) - 5,
      ]),
      answer: String(Math.max(shareA, shareB)),
      explanation: `Parts = ${a}+${b}=${a + b}. Larger share = (${Math.max(a, b)}/${a + b}) × ${total} = ${Math.max(shareA, shareB)}.`,
    };
  },
];

const PROFIT_LOSS_TEMPLATES: Template[] = [
  () => {
    const cp = pick([200, 300, 400, 500, 600, 800, 1000]);
    const pct = pick([10, 15, 20, 25]);
    const sp = cp + (cp * pct) / 100;
    return {
      stem: `A shopkeeper buys an article for Rs.${cp} and sells it at a ${pct}% profit. Find the selling price.`,
      options: mcqOptions(sp, [cp, sp + 20, sp - 20]),
      answer: String(sp),
      explanation: `Profit = ${pct}% of ${cp} = ${(cp * pct) / 100}. SP = CP + Profit = ${cp} + ${(cp * pct) / 100} = Rs.${sp}.`,
    };
  },
  () => {
    const sp = pick([440, 480, 540, 600, 660, 720]);
    const pct = pick([10, 20, 25]);
    const cp = (sp * 100) / (100 + pct);
    if (cp !== Math.round(cp)) return PROFIT_LOSS_TEMPLATES[0]();
    return {
      stem: `An article is sold for Rs.${sp} at a ${pct}% profit. What was the cost price?`,
      options: mcqOptions(cp, [cp + 20, cp - 20, sp]),
      answer: String(cp),
      explanation: `CP = SP × 100/(100+profit%) = ${sp} × 100/${100 + pct} = Rs.${cp}.`,
    };
  },
];

const SIMPLE_INTEREST_TEMPLATES: Template[] = [
  () => {
    const p = pick([1000, 2000, 3000, 5000, 8000]);
    const r = pick([4, 5, 6, 8, 10]);
    const t = pick([2, 3, 4, 5]);
    const si = (p * r * t) / 100;
    return {
      stem: `Find the simple interest on Rs.${p} at ${r}% per annum for ${t} years.`,
      options: mcqOptions(si, [si + 100, si - 100, si + 50]),
      answer: String(si),
      explanation: `SI = (P × R × T)/100 = (${p} × ${r} × ${t})/100 = Rs.${si}.`,
    };
  },
];

const AVERAGE_TEMPLATES: Template[] = [
  () => {
    const n = pick([4, 5, 6, 7, 8]);
    const avg = pick([20, 25, 30, 35, 40, 45, 50]);
    const total = n * avg;
    const newVal = pick([60, 70, 75, 80, 85, 90]);
    const newAvg = parseFloat(((total + newVal) / (n + 1)).toFixed(2));
    return {
      stem: `The average of ${n} numbers is ${avg}. A new number ${newVal} is added. What is the new average?`,
      options: mcqOptions(newAvg, [avg, newAvg + 2, newAvg - 2]),
      answer: String(newAvg),
      explanation: `Total = ${n} × ${avg} = ${total}. New total = ${total} + ${newVal} = ${total + newVal}. New average = ${total + newVal}/${n + 1} = ${newAvg}.`,
    };
  },
];

const SPEED_DISTANCE_TEMPLATES: Template[] = [
  () => {
    const speed = pick([40, 50, 60, 72, 80, 90]);
    const time = pick([2, 3, 4, 5]);
    const dist = speed * time;
    return {
      stem: `A car travels at ${speed} km/h for ${time} hours. What distance does it cover?`,
      options: mcqOptions(dist, [dist + 20, dist - 20, dist + 40]),
      answer: String(dist),
      explanation: `Distance = Speed × Time = ${speed} × ${time} = ${dist} km.`,
    };
  },
  () => {
    const dist = pick([120, 150, 180, 200, 240, 300]);
    const speed = pick([40, 50, 60, 75]);
    const time = dist / speed;
    if (time !== Math.round(time * 2) / 2) return SPEED_DISTANCE_TEMPLATES[0]();
    return {
      stem: `A train covers ${dist} km at a speed of ${speed} km/h. How long does the journey take?`,
      options: mcqOptions(time, [time + 1, time - 0.5, time + 0.5]),
      answer: String(time),
      explanation: `Time = Distance/Speed = ${dist}/${speed} = ${time} hours.`,
    };
  },
];

const ALL_TEMPLATES: Record<string, Template[]> = {
  Percentages: PERCENTAGE_TEMPLATES,
  "Ratio and Proportion": RATIO_TEMPLATES,
  "Profit and Loss": PROFIT_LOSS_TEMPLATES,
  "Simple Interest": SIMPLE_INTEREST_TEMPLATES,
  Averages: AVERAGE_TEMPLATES,
  "Speed, Distance and Time": SPEED_DISTANCE_TEMPLATES,
};

export function generateQuantVariation(topic: string): GeneratedQuestion | null {
  const templates = ALL_TEMPLATES[topic];
  if (!templates || templates.length === 0) return null;
  try {
    const q = pick(templates)();
    // Basic sanity: answer must be in options for MCQ
    if (q.options && !q.options.includes(q.answer)) return null;
    return q;
  } catch {
    return null;
  }
}

export const TEMPLATE_TOPICS = Object.keys(ALL_TEMPLATES);
