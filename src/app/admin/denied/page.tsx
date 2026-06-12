import Link from "next/link";
import { signIn } from "@/auth";
import { ShieldX } from "lucide-react";

export default function DeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldX className="mb-4 h-12 w-12 text-danger" />
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        This admin area is restricted to the owner account. You&apos;re signed
        in with a different Google account.
      </p>
      <div className="mt-6 flex gap-3">
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/admin" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Sign in with the right account
          </button>
        </form>
        <Link
          href="/"
          className="rounded-lg border px-4 py-2 text-sm hover:bg-card"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
