import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, ADMIN_EMAIL } from "@/auth";
import { prisma } from "@/lib/db";
import { EXAMS, SECTION_LABELS } from "@/lib/examConfig";
import type { Exam, SectionKey } from "@/lib/examConfig";
import type { SectionScore } from "@/lib/scoring";
import { Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function topicAcc(answers: { question: { topic: string }; isCorrect: boolean | null }[]) {
  const map = new Map<string, { correct: number; total: number }>();
  for (const a of answers) {
    const t = a.question.topic;
    const s = map.get(t) ?? { correct: 0, total: 0 };
    s.total++;
    if (a.isCorrect) s.correct++;
    map.set(t, s);
  }
  return map;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ base?: string; other?: string }>;
}) {
  const { base, other } = await searchParams;
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  if (!base) redirect("/");

  const baseAttempt = await prisma.attempt.findUnique({
    where: { id: base },
    include: {
      profile: true,
      answers: {
        select: { isCorrect: true, question: { select: { topic: true } } },
      },
    },
  });
  if (!baseAttempt?.submittedAt) redirect("/");
  if (
    session.user.email !== ADMIN_EMAIL &&
    baseAttempt.profile.email !== session.user.email
  ) {
    redirect("/");
  }

  // ── Picker view ──────────────────────────────────────────────────────────
  if (!other) {
    const others = await prisma.attempt.findMany({
      where: {
        profileId: baseAttempt.profileId,
        submittedAt: { not: null },
        id: { not: base },
      },
      orderBy: { submittedAt: "desc" },
    });
    const baseConfig = EXAMS[baseAttempt.exam as Exam];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Compare attempts</h1>
          <p className="text-sm text-muted">Select a second attempt to compare against</p>
        </div>

        <Card>
          <p className="mb-1 text-xs font-semibold text-muted uppercase tracking-wide">Attempt A (base)</p>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="font-semibold">{baseConfig.label} · {baseAttempt.mode}</div>
              <div className="text-sm text-muted">{fmtDate(baseAttempt.submittedAt!)}</div>
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {baseAttempt.rawScore}
              <span className="text-base font-normal text-muted">/{baseAttempt.maxScore}</span>
            </div>
            {baseAttempt.percentile != null && (
              <div className="font-semibold text-primary">
                {baseAttempt.percentile.toFixed(1)}th %ile
              </div>
            )}
          </div>
        </Card>

        {others.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No other completed attempts to compare with yet.</p>
            <Link href="/" className="mt-3 block text-sm text-primary hover:underline">
              ← Take a new mock
            </Link>
          </Card>
        ) : (
          <Card>
            <p className="mb-3 font-semibold">Choose attempt B:</p>
            <div className="divide-y">
              {others.map((a) => {
                const cfg = EXAMS[a.exam as Exam];
                return (
                  <Link
                    key={a.id}
                    href={`/compare?base=${base}&other=${a.id}`}
                    className="flex items-center justify-between py-3 text-sm transition hover:text-primary"
                  >
                    <div>
                      <span className="font-medium">{cfg.label} · {a.mode}</span>
                      <span className="ml-2 text-muted">{fmtDate(a.submittedAt!)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums font-semibold">
                        {a.rawScore}/{a.maxScore}
                      </span>
                      {a.percentile != null && (
                        <span className="text-xs text-muted">
                          {a.percentile.toFixed(1)}%ile
                        </span>
                      )}
                      <span className="text-primary text-xs">Compare →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        )}

        <Link href={`/results/${base}`} className="block text-sm text-muted hover:text-foreground">
          ← Back to results
        </Link>
      </div>
    );
  }

  // ── Comparison view ───────────────────────────────────────────────────────
  // Reuse the baseAttempt already fetched above — only fetch the second attempt.
  const a1 = baseAttempt;
  const a2 = await prisma.attempt.findUnique({
    where: { id: other },
    include: {
      profile: true,
      answers: {
        select: { isCorrect: true, question: { select: { topic: true } } },
      },
    },
  });

  if (!a2?.submittedAt) redirect(`/compare?base=${base}`);
  if (
    session.user.email !== ADMIN_EMAIL &&
    a2.profile.email !== session.user.email
  ) {
    redirect("/");
  }

  const cfg1 = EXAMS[a1.exam as Exam];
  const cfg2 = EXAMS[a2.exam as Exam];
  const sameExam = a1.exam === a2.exam;

  const sec1: Record<string, SectionScore> = JSON.parse(a1.sectionScores ?? "{}");
  const sec2: Record<string, SectionScore> = JSON.parse(a2.sectionScores ?? "{}");

  const topics1 = topicAcc(a1.answers);
  const topics2 = topicAcc(a2.answers);
  const allTopics = Array.from(new Set([...topics1.keys(), ...topics2.keys()])).sort();

  const scorePct1 = a1.maxScore ? Math.round(((a1.rawScore ?? 0) / a1.maxScore) * 100) : null;
  const scorePct2 = a2.maxScore ? Math.round(((a2.rawScore ?? 0) / a2.maxScore) * 100) : null;

  function diffColor(val: number) {
    if (val > 0) return "text-success";
    if (val < 0) return "text-danger";
    return "text-muted";
  }
  function diffStr(val: number) {
    return val > 0 ? `+${val}` : `${val}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Attempt comparison</h1>
          <p className="text-sm text-muted">
            {fmtDate(a1.submittedAt!)} vs {fmtDate(a2.submittedAt!)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/compare?base=${base}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-card">
            ← Change
          </Link>
          <Link href={`/results/${base}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-card">
            Results A
          </Link>
          <Link href={`/results/${other}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-card">
            Results B
          </Link>
        </div>
      </div>

      {/* Headline */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Score */}
        <Card className="text-center">
          <div className="mb-2 text-sm font-semibold text-muted">Score</div>
          <div className="flex items-center justify-around gap-2">
            <div>
              <div className="text-xs text-muted mb-1">A · {cfg1.label}</div>
              <div className="text-2xl font-bold tabular-nums">
                {a1.rawScore}<span className="text-sm text-muted">/{a1.maxScore}</span>
              </div>
              {scorePct1 != null && <div className="text-xs text-muted">{scorePct1}%</div>}
            </div>
            <div className={cn("text-lg font-bold tabular-nums", diffColor((a2.rawScore ?? 0) - (a1.rawScore ?? 0)))}>
              {diffStr((a2.rawScore ?? 0) - (a1.rawScore ?? 0))}
            </div>
            <div>
              <div className="text-xs text-muted mb-1">B · {cfg2.label}</div>
              <div className="text-2xl font-bold tabular-nums">
                {a2.rawScore}<span className="text-sm text-muted">/{a2.maxScore}</span>
              </div>
              {scorePct2 != null && <div className="text-xs text-muted">{scorePct2}%</div>}
            </div>
          </div>
        </Card>

        {/* Percentile */}
        <Card className="text-center">
          <div className="mb-2 text-sm font-semibold text-muted">Est. percentile</div>
          <div className="flex items-center justify-around gap-2">
            <div className="text-2xl font-bold tabular-nums text-primary">
              {a1.percentile?.toFixed(1) ?? "—"}
            </div>
            {a1.percentile != null && a2.percentile != null && (
              <div className={cn("text-base font-semibold tabular-nums", diffColor(a2.percentile - a1.percentile))}>
                {diffStr(Math.round((a2.percentile - a1.percentile) * 10) / 10)}
              </div>
            )}
            <div className="text-2xl font-bold tabular-nums text-primary">
              {a2.percentile?.toFixed(1) ?? "—"}
            </div>
          </div>
        </Card>

        {/* Cutoff */}
        <Card className="text-center">
          <div className="mb-2 text-sm font-semibold text-muted">Sectional cut-offs</div>
          <div className="flex items-center justify-around gap-4">
            <div className={cn("text-xl font-bold", a1.clearedCutoff ? "text-success" : "text-danger")}>
              {a1.clearedCutoff ? "Cleared" : "Failed"}
            </div>
            <div className={cn("text-xl font-bold", a2.clearedCutoff ? "text-success" : "text-danger")}>
              {a2.clearedCutoff ? "Cleared" : "Failed"}
            </div>
          </div>
        </Card>
      </div>

      {/* Section breakdown */}
      {sameExam && (
        <Card>
          <h3 className="mb-3 font-semibold">Section breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted">
                  <th className="pb-2 font-medium">Section</th>
                  <th className="pb-2 font-medium text-center">A score</th>
                  <th className="pb-2 font-medium text-center">B score</th>
                  <th className="pb-2 font-medium text-center">Diff</th>
                  <th className="pb-2 font-medium text-center">A cut-off</th>
                  <th className="pb-2 font-medium text-center">B cut-off</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cfg1.sections.map((s) => {
                  const s1 = sec1[s.key];
                  const s2 = sec2[s.key];
                  if (!s1 && !s2) return null;
                  const diff = (s2?.score ?? 0) - (s1?.score ?? 0);
                  return (
                    <tr key={s.key} className="text-center">
                      <td className="py-2 text-left font-medium">{s.label}</td>
                      <td className="py-2 tabular-nums">{s1 ? `${s1.score}/${s1.max}` : "—"}</td>
                      <td className="py-2 tabular-nums">{s2 ? `${s2.score}/${s2.max}` : "—"}</td>
                      <td className={cn("py-2 tabular-nums font-semibold", diffColor(diff))}>
                        {s1 && s2 ? diffStr(diff) : "—"}
                      </td>
                      <td className="py-2">
                        {s1 ? (
                          <Badge tone={s1.clearedCutoff ? "success" : "danger"}>
                            {s1.clearedCutoff ? "✓" : "✗"}
                          </Badge>
                        ) : "—"}
                      </td>
                      <td className="py-2">
                        {s2 ? (
                          <Badge tone={s2.clearedCutoff ? "success" : "danger"}>
                            {s2.clearedCutoff ? "✓" : "✗"}
                          </Badge>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Topic accuracy */}
      <Card>
        <h3 className="mb-3 font-semibold">Topic accuracy</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted">
                <th className="pb-2 font-medium">Topic</th>
                <th className="pb-2 font-medium text-center">A</th>
                <th className="pb-2 font-medium text-center">B</th>
                <th className="pb-2 font-medium text-center">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allTopics.map((topic) => {
                const t1 = topics1.get(topic);
                const t2 = topics2.get(topic);
                const pct1 = t1 ? Math.round((t1.correct / t1.total) * 100) : null;
                const pct2 = t2 ? Math.round((t2.correct / t2.total) * 100) : null;
                const diff = pct1 != null && pct2 != null ? pct2 - pct1 : null;
                return (
                  <tr key={topic} className="text-center">
                    <td className="py-2 text-left">{topic}</td>
                    <td className="py-2 tabular-nums">
                      {pct1 != null ? (
                        <span className={cn(
                          "font-semibold",
                          pct1 >= 70 ? "text-success" : pct1 >= 40 ? "text-warning" : "text-danger"
                        )}>
                          {pct1}%
                          <span className="ml-1 text-xs font-normal text-muted">
                            ({t1!.correct}/{t1!.total})
                          </span>
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="py-2 tabular-nums">
                      {pct2 != null ? (
                        <span className={cn(
                          "font-semibold",
                          pct2 >= 70 ? "text-success" : pct2 >= 40 ? "text-warning" : "text-danger"
                        )}>
                          {pct2}%
                          <span className="ml-1 text-xs font-normal text-muted">
                            ({t2!.correct}/{t2!.total})
                          </span>
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className={cn("py-2 tabular-nums font-semibold", diff != null ? diffColor(diff) : "text-muted")}>
                      {diff != null ? diffStr(diff) + "%" : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
