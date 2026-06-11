import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, XCircle, MinusCircle, Info } from "lucide-react";
import { prisma } from "@/lib/db";
import { EXAMS, SECTION_LABELS, SectionKey, Exam } from "@/lib/examConfig";
import { PERCENTILE_DISCLAIMER } from "@/lib/percentile";
import type { SectionScore } from "@/lib/scoring";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const scorePct = Math.round(
    ((attempt.rawScore ?? 0) / (attempt.maxScore || 1)) * 100
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Result</h1>
          <p className="text-sm text-muted">
            {attempt.profile.name} · {config.label} · {attempt.mode} mock
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
            <span className="text-lg text-muted">/{attempt.maxScore}</span>
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
            {attempt.percentile?.toFixed(1)}
          </div>
          <div className="text-xs text-muted">estimate, not official</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm text-muted">Sectional cut-offs</div>
          <div
            className={cn(
              "mt-1 text-2xl font-bold",
              attempt.clearedCutoff ? "text-success" : "text-danger"
            )}
          >
            {attempt.clearedCutoff ? "All cleared" : "Not cleared"}
          </div>
          <div className="text-xs text-muted">
            {exam === "INDORE"
              ? "Must clear every section to qualify"
              : "Overall merit-based"}
          </div>
        </Card>
      </div>

      {/* Section breakdown */}
      <Card>
        <h3 className="mb-3 font-semibold">Section breakdown</h3>
        <div className="space-y-2">
          {config.sections.map((s) => {
            const ss = sectionScores[s.key];
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

      {/* Topic strengths / weaknesses */}
      <Card>
        <h3 className="mb-3 font-semibold">Topic accuracy</h3>
        <div className="space-y-1.5">
          {topicRows.map(([topic, s]) => {
            const pct = Math.round((s.correct / s.total) * 100);
            return (
              <div key={topic} className="flex items-center gap-3 text-sm">
                <span className="w-48 shrink-0 truncate">{topic}</span>
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
                            {a.question.answer}
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
