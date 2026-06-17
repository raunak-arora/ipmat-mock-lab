import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, XCircle, MinusCircle, Info, Clock } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { EXAMS, SECTION_LABELS, SectionKey, Exam } from "@/lib/examConfig";
import { PERCENTILE_DISCLAIMER } from "@/lib/percentile";
import type { SectionScore } from "@/lib/scoring";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { FORMULAS_BY_TOPIC } from "@/lib/formulas";
import DrillButton from "@/components/DrillButton";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: {
      profile: true,
      answers: { include: { question: true }, orderBy: { order: "asc" } },
    },
  });
  if (!attempt) notFound();
  if (!attempt.submittedAt) redirect(`/mock/${id}`);

  const exam = attempt.exam as Exam;
  const config = EXAMS[exam];
  const sectionScores: Record<string, SectionScore> = JSON.parse(
    attempt.sectionScores ?? "{}"
  );

  // Topic-level accuracy.
  const topicStats = new Map<string, { correct: number; total: number }>();
  for (const a of attempt.answers) {
    const t = a.question.topic;
    const s = topicStats.get(t) ?? { correct: 0, total: 0 };
    s.total += 1;
    if (a.isCorrect) s.correct += 1;
    topicStats.set(t, s);
  }
  const topicRows = [...topicStats.entries()].sort(
    (a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total
  );

  // Weak topics for drill (< 50% accuracy, min 2 questions attempted).
  const weakTopics = topicRows
    .filter(([, s]) => s.total >= 2 && s.correct / s.total < 0.5)
    .map(([t]) => t);

  // Difficulty-level accuracy.
  const difficultyStats = new Map<string, { correct: number; total: number }>();
  for (const a of attempt.answers) {
    const d = a.question.difficulty;
    const s = difficultyStats.get(d) ?? { correct: 0, total: 0 };
    s.total += 1;
    if (a.isCorrect) s.correct += 1;
    difficultyStats.set(d, s);
  }

  // Time analysis.
  const answered = attempt.answers.filter((a) => a.given && a.given.trim() !== "");
  const totalTimeSec = attempt.answers.reduce((s, a) => s + (a.timeSpentSec ?? 0), 0);
  const avgTimeSec = answered.length > 0
    ? Math.round(attempt.answers.reduce((s, a) => s + (a.timeSpentSec ?? 0), 0) / answered.length)
    : 0;
  const correctAnswers = attempt.answers.filter((a) => a.isCorrect === true);
  const wrongAnswers = attempt.answers.filter((a) => a.isCorrect === false && a.given && a.given.trim() !== "");
  const avgTimeCorrect = correctAnswers.length > 0
    ? Math.round(correctAnswers.reduce((s, a) => s + (a.timeSpentSec ?? 0), 0) / correctAnswers.length)
    : null;
  const avgTimeWrong = wrongAnswers.length > 0
    ? Math.round(wrongAnswers.reduce((s, a) => s + (a.timeSpentSec ?? 0), 0) / wrongAnswers.length)
    : null;
  // Slow & wrong: spent > 90s but got it wrong.
  const slowAndWrong = attempt.answers
    .filter((a) => a.isCorrect === false && (a.timeSpentSec ?? 0) > 90 && a.given && a.given.trim() !== "")
    .sort((a, b) => (b.timeSpentSec ?? 0) - (a.timeSpentSec ?? 0))
    .slice(0, 5);

  // Use Google display name for the owner; for everyone else (admin), use AllowedStudent.name.
  let displayName: string;
  if (session?.user?.email === attempt.profile.email) {
    displayName = session.user?.name ?? attempt.profile.name;
  } else {
    const allowed = attempt.profile.email
      ? await prisma.allowedStudent.findFirst({
          where: { email: attempt.profile.email },
          select: { name: true },
        })
      : null;
    displayName = allowed?.name ?? attempt.profile.name;
  }

  // Filter to only sections that were actually attempted (handles old data and sectional mocks).
  const activeSectionScores = Object.fromEntries(
    Object.entries(sectionScores).filter(
      ([, ss]) => ss.correct + ss.wrong + ss.skipped > 0
    )
  );
  // Recompute effective maxScore from active sections (fixes old attempts stored with full-exam max).
  const effectiveMax =
    Object.values(activeSectionScores).reduce((s, ss) => s + ss.max, 0) ||
    attempt.maxScore ||
    1;
  const scorePct = Math.round(((attempt.rawScore ?? 0) / effectiveMax) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Result</h1>
          <p className="text-sm text-muted">
            {displayName} · {config.label} · {attempt.mode} mock
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border px-4 py-2 text-sm hover:bg-card"
        >
          New mock
        </Link>
      </div>

      {/* Headline */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <div className="text-sm text-muted">Score</div>
          <div className="mt-1 text-3xl font-bold tabular-nums">
            {attempt.rawScore}
            <span className="text-lg text-muted">/{effectiveMax}</span>
          </div>
          <div className="text-xs text-muted">{scorePct}% of maximum</div>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-muted">
            Est. percentile
            <span title={PERCENTILE_DISCLAIMER}>
              <Info className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-primary">
            {attempt.percentile?.toFixed(1) ?? "—"}
          </div>
          <div className="text-xs text-muted">estimate, not official</div>
        </Card>
        {attempt.mode !== "TOPIC" && (
          <Card className="text-center">
            <div className="text-sm text-muted">
              {attempt.mode === "FULL" ? "Sectional cut-offs" : "Cut-off"}
            </div>
            <div
              className={cn(
                "mt-1 text-2xl font-bold",
                attempt.clearedCutoff ? "text-success" : "text-danger"
              )}
            >
              {attempt.clearedCutoff ? "Cleared" : "Not cleared"}
            </div>
            <div className="text-xs text-muted">
              {attempt.mode === "FULL"
                ? exam === "INDORE"
                  ? "Must clear every section to qualify"
                  : "Overall merit-based"
                : "Benchmark for this section"}
            </div>
          </Card>
        )}
      </div>

      {/* Section breakdown */}
      <Card>
        <h3 className="mb-3 font-semibold">Section breakdown</h3>
        <div className="space-y-2">
          {config.sections.map((s) => {
            const ss = activeSectionScores[s.key];
            if (!ss) return null;
            return (
              <div
                key={s.key}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{s.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums">
                      {ss.score} / {ss.max}
                    </span>
                    <Badge tone={ss.clearedCutoff ? "success" : "danger"}>
                      cut-off {ss.cutoff}
                      {ss.clearedCutoff ? " ✓" : " ✗"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-1 flex gap-4 text-xs text-muted">
                  <span className="text-success">{ss.correct} correct</span>
                  <span className="text-danger">{ss.wrong} wrong</span>
                  <span>{ss.skipped} skipped</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Difficulty breakdown */}
      <Card>
        <h3 className="mb-3 font-semibold">Difficulty breakdown</h3>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          {(["EASY", "MEDIUM", "HARD"] as const).map((d) => {
            const s = difficultyStats.get(d) ?? { correct: 0, total: 0 };
            const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : null;
            return (
              <div key={d} className="rounded-lg bg-background p-3">
                <div className={cn(
                  "mb-1 text-xs font-semibold",
                  d === "EASY" ? "text-success" : d === "MEDIUM" ? "text-warning" : "text-danger"
                )}>
                  {d}
                </div>
                {s.total === 0 ? (
                  <div className="text-muted">—</div>
                ) : (
                  <>
                    <div className="text-xl font-bold tabular-nums">{pct}%</div>
                    <div className="text-xs text-muted">{s.correct}/{s.total} correct</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Time analysis */}
      {totalTimeSec > 0 && (
        <Card>
          <h3 className="mb-3 font-semibold">Time analysis</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center text-sm mb-4">
            <div className="rounded-lg bg-background p-3">
              <div className="text-lg font-bold tabular-nums">
                {Math.floor(totalTimeSec / 60)}m {totalTimeSec % 60}s
              </div>
              <div className="text-xs text-muted mt-0.5">Total time used</div>
            </div>
            <div className="rounded-lg bg-background p-3">
              <div className="text-lg font-bold tabular-nums">{avgTimeSec}s</div>
              <div className="text-xs text-muted mt-0.5">Avg per question</div>
            </div>
            {avgTimeCorrect !== null && (
              <div className="rounded-lg bg-background p-3">
                <div className="text-lg font-bold tabular-nums text-success">{avgTimeCorrect}s</div>
                <div className="text-xs text-muted mt-0.5">Avg on correct</div>
              </div>
            )}
            {avgTimeWrong !== null && (
              <div className="rounded-lg bg-background p-3">
                <div className="text-lg font-bold tabular-nums text-danger">{avgTimeWrong}s</div>
                <div className="text-xs text-muted mt-0.5">Avg on wrong</div>
              </div>
            )}
          </div>
          {slowAndWrong.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-warning">
                Slow &amp; wrong — spent &gt;90s but got wrong:
              </p>
              <div className="space-y-1.5">
                {slowAndWrong.map((a, i) => (
                  <div key={a.id} className="flex items-start gap-2 rounded-lg bg-background px-3 py-2 text-xs">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                    <span className="flex-1 text-muted line-clamp-1">{a.question.stem}</span>
                    <span className="shrink-0 tabular-nums text-danger font-medium">
                      {a.timeSpentSec}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Topic strengths / weaknesses */}
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-semibold">Topic accuracy</h3>
          {weakTopics.length > 0 && (
            <DrillButton
              exam={attempt.exam}
              profileId={attempt.profileId}
              weakTopics={weakTopics}
            />
          )}
        </div>
        <div className="space-y-2">
          {topicRows.map(([topic, s]) => {
            const pct = Math.round((s.correct / s.total) * 100);
            const formulas = FORMULAS_BY_TOPIC[topic];
            const isWeak = pct < 40;
            return (
              <div key={topic}>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 truncate sm:w-44">{topic}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        pct >= 70
                          ? "bg-success"
                          : pct >= 40
                            ? "bg-warning"
                            : "bg-danger"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted">
                    {s.correct}/{s.total} ({pct}%)
                  </span>
                </div>
                {isWeak && formulas && formulas.length > 0 && (
                  <details className="mt-1 ml-0">
                    <summary className="cursor-pointer text-xs text-danger hover:text-foreground ml-[7.5rem] sm:ml-44 select-none">
                      Key formulas for {topic} ▾
                    </summary>
                    <div className="mt-1.5 ml-[7.5rem] sm:ml-44 space-y-1">
                      {formulas.map((entry, i) => (
                        <div key={i} className="rounded-lg bg-background px-3 py-2">
                          <div className="text-xs font-semibold text-foreground/90">
                            {entry.label}
                          </div>
                          {entry.formula && (
                            <div className="mt-0.5 font-mono text-xs text-primary">
                              {entry.formula}
                            </div>
                          )}
                          {entry.note && (
                            <div className="mt-0.5 text-xs text-muted leading-relaxed">
                              {entry.note}
                            </div>
                          )}
                        </div>
                      ))}
                      <Link
                        href="/formulas"
                        className="block text-xs text-primary hover:underline pt-0.5"
                      >
                        See full formula sheet →
                      </Link>
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Per-question review */}
      <Card>
        <h3 className="mb-3 font-semibold">Solution review</h3>
        <div className="space-y-4">
          {attempt.answers.map((a, i) => {
            const correct = a.isCorrect;
            const Icon =
              correct === true
                ? CheckCircle2
                : correct === false
                  ? XCircle
                  : MinusCircle;
            const tone =
              correct === true
                ? "text-success"
                : correct === false
                  ? "text-danger"
                  : "text-muted";
            return (
              <div key={a.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start gap-2">
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone)} />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                      <span>Q{i + 1}</span>
                      <span>·</span>
                      <span>{SECTION_LABELS[a.section as SectionKey]}</span>
                      <span>·</span>
                      <span>{a.question.topic}</span>
                      {(a.timeSpentSec ?? 0) > 0 && (
                        <>
                          <span>·</span>
                          <span className={cn(
                            "flex items-center gap-0.5",
                            (a.timeSpentSec ?? 0) > 120 ? "text-warning" : ""
                          )}>
                            <Clock className="h-3 w-3" />
                            {a.timeSpentSec}s
                          </span>
                        </>
                      )}
                      <span className="ml-auto tabular-nums">
                        {a.marks != null && a.marks !== 0
                          ? `${a.marks > 0 ? "+" : ""}${a.marks}`
                          : "0"}{" "}
                        marks
                      </span>
                    </div>
                    {a.question.passage && (
                      <details className="mb-2 text-xs text-muted">
                        <summary className="cursor-pointer">Show passage</summary>
                        <p className="mt-1 whitespace-pre-line">
                          {a.question.passage}
                        </p>
                      </details>
                    )}
                    <p className="whitespace-pre-line text-sm font-medium">
                      {a.question.stem}
                    </p>
                    <div className="mt-2 grid gap-1 text-sm">
                      <div>
                        <span className="text-muted">Your answer: </span>
                        <span
                          className={
                            correct === true
                              ? "text-success"
                              : correct === false
                                ? "text-danger"
                                : "text-muted"
                          }
                        >
                          {a.given && a.given.trim() !== ""
                            ? a.given
                            : "— not attempted —"}
                        </span>
                      </div>
                      {correct !== true && (
                        <div>
                          <span className="text-muted">Correct answer: </span>
                          <span className="font-medium text-success">
                            {(() => {
                              try {
                                const parsed = JSON.parse(a.question.answer);
                                if (Array.isArray(parsed) && parsed.length > 0)
                                  return parsed[0];
                              } catch {}
                              return a.question.answer;
                            })()}
                          </span>
                        </div>
                      )}
                      {a.question.explanation && (
                        <p className="mt-1 rounded-md bg-background p-2 text-xs text-foreground/80">
                          {a.question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
