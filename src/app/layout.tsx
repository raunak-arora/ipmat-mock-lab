import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, LayoutDashboard, LogIn, Settings } from "lucide-react";
import { auth, signIn, signOut, ADMIN_EMAIL } from "@/auth";
import { SignOutButton } from "@/components/SignOutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPMAT Mock Lab",
  description: "Realistic IPMAT Indore & Rohtak mock exams with performance analytics.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span>IPMAT Mock Lab</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {isAdmin ? (
                // Admin nav
                <>
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted hover:bg-background hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    Admin
                  </Link>
                  <SignOutButton
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                    name={session.user?.name}
                    image={session.user?.image}
                    email={session.user?.email}
                  />
                </>
              ) : session?.user ? (
                // Logged-in student nav
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted hover:bg-background hover:text-foreground"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <SignOutButton
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                    name={session.user?.name}
                    image={session.user?.image}
                    email={session.user?.email}
                  />
                </>
              ) : (
                // Signed-out nav (shouldn't normally show — middleware requires login)
                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted/50 hover:text-muted"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign in
                  </button>
                </form>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
