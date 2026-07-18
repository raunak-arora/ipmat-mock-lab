# Scripts

All scripts run with `npx tsx scripts/<file>.ts` and need `DATABASE_URL` in `.env`.
The Neon DB autosuspends when idle — if the first run fails with `P1001: Can't
reach database server`, just run it again.

## Active tools (safe to re-run)

| Script | Purpose |
|---|---|
| `generate-cat-questions.ts` | Template engine for the CAT bank. Answers are **computed**, never hand-written. Idempotent — dedups on stem+passage against the DB, so re-running only adds new variants. Bump the `TARGETS` constants to grow the bank. |
| `seed-cat-questions.ts` / `seed-cat-questions-2.ts` | Hand-written CAT seed questions (idempotent, stem-diff). Mostly spent — the generator is the primary growth path now. Note: `migrations/fix-seed-defects.ts` patched many of these in the DB, so re-seeding a **fresh** DB re-introduces those defects unless you re-run that migration after. |
| `add-questions.ts` | Syncs the IPMAT seed data (`src/data/*`) into the DB by stem-diff. Idempotent. |
| `check-jobs.ts` | Prints recent `AdminJob` rows (dedup / quality-scan runs). Read-only ops utility. |
| `test-admin-api.ts` | Ad-hoc console checks for the admin allowlist logic. Candidate for a real test runner. |

## migrations/ (one-off, already applied — kept for provenance)

These were each run once against the live DB. They are idempotent or no-op on
re-run, but there is no reason to re-run them unless restoring from a pre-fix
backup. Kept because they document *why* specific rows look the way they do.

| Script | What it did (date applied) |
|---|---|
| `fix-seed-defects.ts` | Remediated the hand-written CAT seeds after an independent re-solve of all 196: 25 wrong keys fixed, 27 broken deleted, 5 TITA restemmed (2026-07-14). |
| `fix-generated-defects.ts` | Post-audit cleanup of template-generated questions: NaN/duplicate options, negative pie answers, tied line-graph maxima, surd TITA → multi-answer, ordinals, CR stems (2026-07-14). |
| `fix-cat-option-format.ts` | Converted 113 CAT MCQs from `"A) text"` options + letter answers to bare text (the grader matches option text) (2026-07-14). |
| `backfill-set-ids.ts` | Grouped 1,585 pre-`setId` DILR/RC questions into 498 sets by exact passage text (2026-07-14). |
| `normalize-topics.ts` | Renamed legacy topic names to the canonical taxonomy in `examConfig.ts`. |
| `apply-audit-fixes.ts`, `apply-fixes.ts`, `fix-questions.ts` | Earlier hand-keyed IPMAT question corrections (hardcoded IDs from June 2026 audits). |

## Deleted (for the record)

`audit-all.ts`, `audit-check2.ts`, `audit-deep.ts`, `read-fix-questions.ts` —
debugging scratch from the June audit session; the detection logic lives on in
`src/app/api/admin/quality-scan/route.ts`. `test-is-admin.ts` — tested a
copy-pasted duplicate of `isAdmin()` rather than the real module.
