import { prisma } from "@/lib/db";
import { auth, ADMIN_EMAIL } from "@/auth";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const isAdmin = email === ADMIN_EMAIL;

  // Admin sees all profiles; students see only their own
  const rawProfiles = await prisma.profile.findMany({
    where: isAdmin ? undefined : { email },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true },
  });

  // Overlay AllowedStudent.name (admin-set or Google-synced) for display
  const emails = rawProfiles.map((p) => p.email).filter(Boolean) as string[];
  const allowed = await prisma.allowedStudent.findMany({
    where: { email: { in: emails } },
    select: { email: true, name: true },
  });
  const nameByEmail = new Map(allowed.map((s) => [s.email, s.name]));

  // For the student's own profile, Google session name takes highest priority
  const googleName = !isAdmin ? (session?.user?.name ?? null) : null;

  const profiles = rawProfiles.map((p) => ({
    id: p.id,
    name:
      (p.email === email && googleName) ||
      (p.email && nameByEmail.get(p.email)) ||
      p.name,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>
        <p className="text-sm text-muted">
          Track score, estimated percentile and topic mastery across mocks.
        </p>
      </div>
      <Dashboard profiles={profiles} />
    </div>
  );
}
