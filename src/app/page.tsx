import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock, BarChart2, Target, Trophy, BookOpen } from "lucide-react";
import { auth, signIn, ADMIN_EMAIL } from "@/auth";
import { prisma } from "@/lib/db";
import { EXAMS } from "@/lib/examConfig";
import StartMock from "@/components/StartMock";
import { Badge, Card } from "@/components/ui";
import { isStudentAllowed, getOrCreateProfile } from "@/lib/allowlist";

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
  const isAdmin = email === ADMIN_EMAIL;

  if (!isAdmin) {
    const allowed = await isStudentAllowed(email);
    if (!allowed) redirect("/denied");
  }

  const profile = await getOrCreateProfile(email, session.user.name ?? "");

  const [recent, totalAttempts] = await Promise.all([
    prisma.attempt.findMany({
      where: { profileId: profile.id, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    prisma.attempt.count({
      where: { profileId: profile.id, submittedAt: { not: null } },
    }),
  ]);

  const avgScore = recent.length > 0
    ? Math.round(recent.reduce((s, a) => s + ((a.rawScore ?? 0) / (a.maxScore || 1)) * 100, 0) / recent.length)
    : null;
  const avgPercentile = recent.length > 0
    ? Math.round(recent.reduce((s, a) => s + (a.percentile ?? 0), 0) / recent.length)
    : null;

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
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
          {[
            { label: "Attempts", value: totalAttempts },
            { label: "Avg score %", value: avgScore != null ? `${avgScore}%` : "—" },
            { label: "Avg percentile", value: avgPercentile != null ? `${avgPercentile}th` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border bg-card p-4 text-center">
              <div className="text-xl font-bold">{value}</div>
              <div className="mt-0.5 text-xs text-muted">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <StartMock profileId={profile.id} profileName={displayName} />

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
                {recent.map((a) => (
                  <Link
                    key={a.id}
                    href={`/results/${a.id}`}
                    className="flex items-center justify-between py-2.5 text-sm hover:opacity-80"
                  >
                    <div>
                      <span className="font-medium">{EXAMS[a.exam as "INDORE" | "ROHTAK"].label}</span>
                      <span className="ml-1.5 text-xs text-muted">{a.mode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-xs">{a.rawScore}/{a.maxScore}</span>
                      <Badge tone={a.clearedCutoff ? "success" : "danger"}>
                        {a.percentile?.toFixed(0)}%ile
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
        </div>
      </div>
    </div>
  );
}
