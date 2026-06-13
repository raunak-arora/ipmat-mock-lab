"use client";

import { LogOut } from "lucide-react";

interface Props {
  action: () => Promise<void>;
  name?: string | null;
  image?: string | null;
}

export function SignOutButton({ action, name, image }: Props) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!window.confirm("Sign out of the admin panel?")) {
      e.preventDefault();
    }
  }

  return (
    <form action={action}>
      <button
        type="submit"
        onClick={handleClick}
        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted hover:bg-background hover:text-foreground"
      >
        {image ? (
          <img
            src={image}
            alt=""
            className="h-6 w-6 rounded-full ring-2 ring-primary/20"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
            {name?.[0]?.toUpperCase() ?? "A"}
          </div>
        )}
        <span className="max-w-[120px] truncate font-medium text-foreground">
          {name ?? "Admin"}
        </span>
        <LogOut className="h-3.5 w-3.5 opacity-50" />
      </button>
    </form>
  );
}
