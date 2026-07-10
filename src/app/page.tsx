import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock, BarChart2, Target, Trophy, BookOpen, FileText } from "lucide-react";
import { auth, signIn } from "@/auth";
import { isAdmin as getIsAdmin } from "@/lib/is-admin";
import { prisma } from "@/lib/db";
import { EXAMS } from "@/lib/examConfig";
import StartMock from "@/components/StartMock";
import DrillButton from "@/components/DrillButton";
import { Badge, Card } from "@/components/ui";
import { isStudentAllowed, getStudentAllowedExams, getOrCreateProfile } from "@/lib/allowlist";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  /* ── Unauthenticated → landing page ── */
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl space-y-16 py-12">
        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted">
            <Trophy className="h-4 w-4 text-primary" />
            IPMAT Indore &amp; Rohtak
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Practice smarter.<br />Score higher.
          </h1>
          <p className="mx-auto max-w-md text-lg text-muted leading-relaxed">
            Realistic timed mocks with instant scoring, estimated percentile,
            sectional cut-off checks, and full solution reviews — built for
            serious IPMAT prep.
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-3 rounded-xl border bg-card px-6 py-3 text-base font-medium shadow-sm hover:bg-background transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Full-length mocks",
              desc: "Timed exactly like the real exam — sectional locks for Indore, free navigation for Rohtak.",
            },
            {
              icon: BarChart2,
              title: "Instant analysis",
              desc: "Score, percentile estimate, cutoff check, and per-question explanations right after you submit.",
            },
            {
              icon: BookOpen,
              title: "Topic practice",
              desc: "Drill weak areas with sectional or topic-wise sets without sitting a full mock.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-5">
              <Icon className="mb-3 h-5 w-5 text-primary" />
              <h3 className="mb-1 font-semibold">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>

        {/* Exam quick-ref */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.values(EXAMS).map((e) => (
            <Card key={e.key} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">{e.label}</h3>
                <Badge tone="primary">{e.conductedBy}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                <div className="rounded-lg bg-background p-2">
                  <div className="font-semibold">{e.totalQuestions}</div>
                  <div className="text-muted">questions</div>
                </div>
                <div className="rounded-lg bg-background p-2">
                  <div className="font-semibold">{e.totalMarks}</div>
                  <div className="text-muted">marks</div>
                </div>
                <div className="rounded-lg bg-background p-2">
                  <div className="font-semibold">{e.durationMin}</div>
                  <div className="text-muted">minutes</div>
                </div>
              </div>
              <ul className="space-y-1 text-xs text-muted">
                {e.sections.map((s) => (
                  <li key={s.key} className="flex justify-between">
                    <span>{s.label}</span>
                    <span>{s.count} Q · +{s.marksCorrect}/{s.marksWrong === 0 ? "0" : s.marksWrong}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /* ── Authenticated ── */
  const email = session.user.email ?? "";
  const isAdmin = await getIsAdmin(email);

  if (isAdmin) redirect("/admin");

  const allowed = await isStudentAllowed(email);
  if (!allowed) redirect("/denied");

  const [profile, allowedExams] = await Promise.all([
    getOrCreateProfile(email, session.user.name ?? ""),
    getStudentAllowedExams(email),
  ]);

  const [recent, totalAttempts, allDates, weakTopicAnswers] = await Promise.all([
    prisma.attempt.findMany({
      where: { profileId: profile.id, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      take: 5,
      select: {
        id: true, exam: true, mode: true,
        rawScore: true, maxScore: true, sectionScores: true,
        percentile: true, clearedCutoff: true,
      },
    }),
    prisma.attempt.count({
      where: { profileId: profile.id, submittedAt: { not: null } },
    }),
    prisma.attempt.findMany({
      where: { profileId: profile.id, submittedAt: { not: null } },
      select: { submittedAt: true },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.attemptAnswer.findMany({
      where: { attempt: { profileId: profile.id, submittedAt: { not: null } } },
      select: { isCorrect: true, question: { select: { topic: true } } },
      take: 300,
    }),
  ]);

  // Streak computation (UTC dates).
  const toDateStr = (d: Date) => d.toISOString().split("T")[0];
  const dateset = new Set(allDates.map((a) => toDateStr(a.submittedAt!)));
  let streak = 0;
  const today = new Date();
  const cursor = new Date(today);
  if (!dateset.has(toDateStr(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dateset.has(toDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  // Attempts this week (Mon–Sun).
  const dayOfWeek = today.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);
  const thisWeekCount = allDates.filter((a) => a.submittedAt! >= monday).length;

  // Compute effectiveMax from active sections (fixes sectional mocks showing full-exam max).
  const recentWithMax = recent.map((a) => {
    const ss: Record<string, { correct: number; wrong: number; skipped: number; max: number }> =
      JSON.parse(a.sectionScores ?? "{}");
    const effectiveMax =
      Object.values(ss)
        .filter((s) => s.correct + s.wrong + s.skipped > 0)
        .reduce((sum, s) => sum + s.max, 0) || a.maxScore || 1;
    return { ...a, effectiveMax };
  });

  const avgScore = recentWithMax.length > 0
    ? Math.round(recentWithMax.reduce((s, a) => s + ((a.rawScore ?? 0) / a.effectiveMax) * 100, 0) / recentWithMax.length)
    : null;
  const avgPercentile = recent.length > 0
    ? Math.round(recent.reduce((s, a) => s + (a.percentile ?? 0), 0) / recent.length)
    : null;

  // Weak topic drill — from last 300 answers.
  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const a of weakTopicAnswers) {
    const t = a.question.topic;
    const s = topicMap.get(t) ?? { correct: 0, total: 0 };
    s.total += 1;
    if (a.isCorrect) s.correct += 1;
    topicMap.set(t, s);
  }
  const homeWeakTopics = [...topicMap.entries()]
    .filter(([, s]) => s.total >= 3 && s.correct / s.total < 0.6)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .slice(0, 3)
    .map(([t]) => t);
  const lastExam = (recent[0]?.exam as string | undefined) ?? "INDORE";

  const displayName = session.user.name || profile.name;
  const firstName = displayName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
        <p className="mt-1 text-muted">Ready for a mock? Pick your exam and get started.</p>
      </div>

      {/* Stats row */}
      {totalAttempts > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Attempts", value: totalAttempts },
            { label: "Avg score %", value: avgScore != null ? `${avgScore}%` : "—" },
            { label: "Avg percentile", value: avgPercentile != null ? `${avgPercentile}th` : "—" },
            {
              label: streak > 0 ? `${streak}-day streak` : "This week",
              value: streak > 0 ? "🔥" : `${thisWeekCount}`,
            },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border bg-card p-4 text-center">
              <div className="text-xl font-bold">{value}</div>
              <div className="mt-0.5 text-xs text-muted">{label}</div>
            </div>
          ))}
        </div>
      )}

      {homeWeakTopics.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Focus area this week</p>
              <p className="mt-0.5 text-sm text-muted">
                {homeWeakTopics.join(" · ")}
              </p>
            </div>
            <DrillButton exam={lastExam} profileId={profile.id} weakTopics={homeWeakTopics} />
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <StartMock profileId={profile.id} profileName={displayName} allowedExams={allowedExams} />

        <div className="space-y-4">
          {/* Recent attempts */}
          {recent.length > 0 ? (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Recent attempts</h3>
                <Link href="/dashboard" className="flex items-center gap-1 text-sm text-primary hover:underline">
                  All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y">
                {recentWithMax.map((a) => (
                  <Link
                    key={a.id}
                    href={`/results/${a.id}`}
                    className="flex items-center justify-between py-2.5 text-sm hover:opacity-80"
                  >
                    <div>
                      <span className="font-medium">{EXAMS[a.exam as "INDORE" | "ROHTAK" | "CAT"].label}</span>
                      <span className="ml-1.5 text-xs text-muted">{a.mode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-xs">{a.rawScore}/{a.effectiveMax}</span>
                      <Badge tone={a.clearedCutoff ? "success" : "danger"}>
                        {a.percentile?.toFixed(0) ?? "—"}%ile
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          ) : (
            /* Exam reference cards when no attempts yet */
            Object.values(EXAMS).map((e) => (
              <Card key={e.key} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{e.label}</h3>
                  <Badge tone="primary">{e.conductedBy}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-background p-2">
                    <Target className="mx-auto mb-1 h-4 w-4 text-muted" />
                    {e.totalQuestions} Qs
                  </div>
                  <div className="rounded-lg bg-background p-2">
                    <BarChart2 className="mx-auto mb-1 h-4 w-4 text-muted" />
                    {e.totalMarks} marks
                  </div>
                  <div className="rounded-lg bg-background p-2">
                    <Clock className="mx-auto mb-1 h-4 w-4 text-muted" />
                    {e.durationMin} min
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-muted">
                  {e.sections.map((s) => (
                    <li key={s.key} className="flex justify-between">
                      <span>{s.label}</span>
                      <span>{s.count} Q · +{s.marksCorrect}/{s.marksWrong === 0 ? "0" : s.marksWrong}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))
          )}
          {/* Formula sheet quick-link */}
          <Link
            href="/formulas"
            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm hover:bg-background transition"
          >
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <div className="font-medium">Formula Sheet</div>
              <div className="text-xs text-muted">Key formulas &amp; rules, topic-wise</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted" />
          </Link>
        </div>
      </div>
    </div>
  );
}
