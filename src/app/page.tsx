import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock, ListChecks, Target } from "lucide-react";
import { auth, ADMIN_EMAIL } from "@/auth";
import { prisma } from "@/lib/db";
import { EXAMS } from "@/lib/examConfig";
import StartMock from "@/components/StartMock";
import { Badge, Card } from "@/components/ui";
import { isStudentAllowed, getOrCreateProfile } from "@/lib/allowlist";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const isAdmin = email === ADMIN_EMAIL;

  if (!isAdmin) {
    const allowed = await isStudentAllowed(email);
    if (!allowed) redirect("/denied");
  }

  const profile = await getOrCreateProfile(email, session?.user?.name ?? "");

  const recent = await prisma.attempt.findMany({
    where: { submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: { profile: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">IPMAT Mock Lab</h1>
        <p className="mt-1 text-muted">
          Realistic, timed mocks for IPMAT Indore &amp; Rohtak — with scoring,
          an estimated percentile, sectional cut-off checks, and a full solution
          review.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <StartMock profileId={profile.id} profileName={profile.name} />

        <div className="space-y-4">
          {/* Pattern reference */}
          {Object.values(EXAMS).map((e) => (
            <Card key={e.key} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{e.label}</h3>
                <Badge tone="primary">{e.conductedBy}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-background p-2">
                  <ListChecks className="mx-auto mb-1 h-4 w-4 text-muted" />
                  {e.totalQuestions} Qs
                </div>
                <div className="rounded-lg bg-background p-2">
                  <Target className="mx-auto mb-1 h-4 w-4 text-muted" />
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
                    <span>
                      {s.count} Q · +{s.marksCorrect}/
                      {s.marksWrong === 0 ? "0" : s.marksWrong}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent attempts */}
      {recent.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Recent attempts</h3>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View dashboard <ArrowRight className="h-4 w-4" />
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
                  <span className="font-medium">{a.profile.name}</span>{" "}
                  <span className="text-muted">
                    · {EXAMS[a.exam as "INDORE" | "ROHTAK"].label} · {a.mode}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums">
                    {a.rawScore}/{a.maxScore}
                  </span>
                  <Badge tone={a.clearedCutoff ? "success" : "danger"}>
                    {a.percentile?.toFixed(1)}%ile
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
