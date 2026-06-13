import { prisma } from "@/lib/db";
import { auth, ADMIN_EMAIL } from "@/auth";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const isAdmin = email === ADMIN_EMAIL;

  // Admin sees all profiles; students see only their own
  const profiles = await prisma.profile.findMany({
    where: isAdmin ? undefined : { email },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

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
