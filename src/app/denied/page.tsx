import { signOut } from "@/auth";
import { ShieldX } from "lucide-react";

export default function DeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldX className="mb-4 h-12 w-12 text-danger" />
      <h1 className="text-2xl font-bold">Access Restricted</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Your Google account is not on the access list. Ask the admin to add your
        email.
      </p>
      <form
        className="mt-6"
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-lg border px-4 py-2 text-sm hover:bg-card"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
