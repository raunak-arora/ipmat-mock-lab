"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, ShieldCheck, UserCircle } from "lucide-react";

interface Props {
  action: () => Promise<void>;
  name?: string | null;
  image?: string | null;
  email?: string | null;
}

function Avatar({ name, image, size = "sm" }: { name?: string | null; image?: string | null; size?: "sm" | "lg" }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "A";
  const [imgFailed, setImgFailed] = useState(false);
  const cls = size === "lg" ? "h-10 w-10 text-sm" : "h-6 w-6 text-[10px]";

  if (image && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className={`${cls} rounded-full ring-2 ring-primary/20`}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <div className={`${cls} flex items-center justify-center rounded-full bg-primary font-semibold text-white`}>
      {initials}
    </div>
  );
}

export function SignOutButton({ action, name, image, email }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleConfirm() {
    setConfirmOpen(false);
    formRef.current?.requestSubmit();
  }

  // Position dropdown below the button
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  function handleToggle() {
    if (!dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setDropdownOpen((v) => !v);
  }

  return (
    <>
      <form ref={formRef} action={action} className="hidden" />

      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-background"
      >
        <Avatar name={name} image={image} />
        <span className="max-w-[120px] truncate font-medium text-foreground">
          {name ?? "Admin"}
        </span>
        <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 8L1 3h10z" />
        </svg>
      </button>

      {/* Dropdown */}
      {dropdownOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
          className="fixed z-50 w-60 rounded-xl border bg-card shadow-lg"
        >
          {/* Profile info */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Avatar name={name} image={image} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{name ?? "Admin"}</p>
              <p className="truncate text-xs text-muted">{email ?? ""}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-1">
            <button
              type="button"
              onClick={() => { setDropdownOpen(false); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-background"
            >
              <UserCircle className="h-4 w-4 text-muted" />
              Edit profile
            </button>
            <button
              type="button"
              onClick={() => { setDropdownOpen(false); setConfirmOpen(true); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/5"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm modal */}
      {confirmOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                <ShieldCheck className="h-5 w-5 text-danger" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Sign out?</p>
                <p className="text-xs text-muted">You&apos;ll need to sign in again to access admin.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-background"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
