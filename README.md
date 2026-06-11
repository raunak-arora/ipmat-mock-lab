# IPMAT Mock Lab

A realistic, timed mock-exam platform for **IPMAT Indore** and **IPMAT Rohtak**, with auto-scoring, an estimated percentile, sectional cut-off checks, a full solution review, and a progress dashboard. Built so a single student (or a few) can practise full-length papers at home and have their performance evaluated objectively.

## What it does

- **Two exams, faithfully modelled** — the engine is driven entirely by [`src/lib/examConfig.ts`](src/lib/examConfig.ts):

  | | IPMAT Indore | IPMAT Rohtak |
  |---|---|---|
  | Questions / Marks | 90 / 360 | 120 / 480 |
  | Duration | 120 min | 120 min |
  | Sections | QA-SA (15), QA-MCQ (30), VA (45) | QA (40), LR (40), VA (40) |
  | Sectional timer | **Yes — 40 min each, locked** | No — free movement |
  | Negative marking | −1 on MCQ only; **QA-SA = none** | −1 on every section |

- **Real exam runner** — countdown timers (global + per-section for Indore), question palette (answered / not-answered / marked / not-visited), section locking, type-the-answer input for QA Short Answer, mark-for-review, and auto-submit when time runs out. Timing is derived from the start time and the server clock, so a page refresh never loses or gains time.
- **Honest scoring** — exact +4 / −1 / 0 rules per section, total + section breakdown, and a **"did you clear every sectional cut-off?"** verdict (the decisive filter for IIM Indore).
- **Estimated percentile** — interpolated from publicly disclosed cut-off anchors (e.g. Indore ~164/360 ≈ 95th, ~185 ≈ 99th). Clearly labelled as an estimate, not official.
- **Solution review** — every question with your answer, the correct answer, and an explanation.
- **Dashboard** — score & percentile trend across attempts, topic strength/weakness heatmap, average percentile, best score, and cut-off clear rate, per profile.
- **Question bank admin** — add questions, browse/delete, or **bulk-import JSON**. New questions immediately feed into generated mocks.

> **Note on content & percentile.** IIM does not release official past papers or score-to-percentile tables. The bundled bank is **original, pattern-matched** practice (the same nature as coaching-institute mocks), and the percentile is a **calibrated estimate**. Both are surfaced honestly in the UI.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma + **SQLite** (zero-setup) · Recharts.

## Getting started

```bash
cd ipmat-mock
npm install
cp .env.example .env          # default DATABASE_URL points at a local SQLite file
npm run setup                 # create the DB schema + seed ~150 starter questions
npm run dev                   # http://localhost:3000
```

Open the app, pick the **My Brother** profile (or create a new one), choose an exam and mode, and hit **Start mock**.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also type-checks) |
| `npm run setup` | `prisma db push` + seed the question bank |
| `npm run db:seed` | Seed only (skips if the bank is non-empty) |
| `npm run db:studio` | Open Prisma Studio to inspect the database |
| `npm run lint` | ESLint |

To wipe and reseed from scratch: `npx prisma db push --force-reset && npm run db:seed`.

## Modes

- **Full mock** — a complete, timed paper for the chosen exam.
- **One section** — a single section at full length.
- **Topic practice** — ~15 questions from one topic within a section.

## Growing the question bank

The starter bank lives in [`src/data/`](src/data/) (`quant-mcq.ts`, `quant-sa.ts`, `verbal.ts`, `lr.ts`). Each question follows the `SeedQuestion` shape in [`src/data/types.ts`](src/data/types.ts):

```jsonc
{
  "subject": "QUANT",            // QUANT | VERBAL | LR
  "type": "MCQ",                 // MCQ | SHORT_ANSWER
  "topic": "Arithmetic",
  "difficulty": "EASY",          // EASY | MEDIUM | HARD
  "stem": "What is 10% of 250?",
  "options": ["20", "25", "30", "35"],   // omit for SHORT_ANSWER
  "answer": "25",                // option text (MCQ) or accepted value (SHORT_ANSWER)
  "explanation": "0.1 × 250 = 25."
}
```

Two ways to add more:
1. **Admin UI** (`/admin`) — add one at a time, or paste a JSON array under **Bulk import**.
2. **Edit the seed files** and re-run `npm run db:seed` against a fresh database.

The mock generator maps each exam section to a `(subject, type)` pool, so a single bank of `QUANT/MCQ` and `VERBAL/MCQ` questions is shared across both exams; only `QUANT/SHORT_ANSWER` (Indore QA-SA) and `LR` (Rohtak) are exam-specific.

## How scoring & percentile work

- [`src/lib/scoring.ts`](src/lib/scoring.ts) grades each answer against the section's marking rule (short answers are matched trimmed, case-insensitive, with numeric tolerance) and aggregates per-section and overall scores plus the cut-off verdict.
- [`src/lib/percentile.ts`](src/lib/percentile.ts) maps a raw score to an estimated percentile via piecewise-linear interpolation over the anchors in `examConfig.ts`.

Adjust the cut-offs or percentile anchors in `examConfig.ts` as fresh official data appears each cycle.
