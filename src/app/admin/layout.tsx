import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/is-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!await isAdmin(session?.user?.email)) {
    redirect("/admin/denied");
  }
  return <>{children}</>;
}
