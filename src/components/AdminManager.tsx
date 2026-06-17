"use client";

import { useEffect, useState } from "react";
import { Trash2, UserPlus, Pencil, Check, X, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui";

interface AdminRecord {
  id: string;
  email: string;
  name: string | null;
  addedAt: string;
  isOwner?: boolean;
}

export default function AdminManager() {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    const res = await fetch("/api/admin/admins");
    if (res.ok) {
      const d = await res.json();
      setAdmins(d.admins ?? []);
      setOwnerEmail(d.ownerEmail ?? "");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() || null }),
    });
    setLoading(false);
    if (res.ok) {
      setEmail("");
      setName("");
      load();
    } else {
      const b = await res.json();
      setError(b.error ?? "Failed to add.");
    }
  }

  async function rename(id: string) {
    await fetch(`/api/admin/admins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() || null }),
    });
    setEditingId(null);
    load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const b = await res.json();
      setError(b.error ?? "Failed to remove.");
      return;
    }
    load();
  }

  const displayList: AdminRecord[] = [
    { id: "__owner__", email: ownerEmail, name: "Owner", addedAt: "", isOwner: true },
    ...admins.filter((a) => a.email !== ownerEmail),
  ];

  return (
    <div className="space-y-5">
      {/* Info */}
      <Card className="space-y-3">
        <h3 className="font-semibold">Add admin access</h3>
        <p className="text-sm text-muted">
          Anyone on this list can sign in and access the full admin panel — question bank, student
          management, and analytics. The owner account cannot be removed.
        </p>
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
          New admins must <strong>sign out and back in</strong> the first time to activate access.
        </p>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="colleague@gmail.com"
            className="rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Display name (optional)"
            className="rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            onClick={add}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            Add
          </button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </Card>

      {/* Admin list */}
      <Card>
        <h3 className="mb-3 font-semibold">
          Admin access{" "}
          <span className="text-sm font-normal text-muted">({displayList.length})</span>
        </h3>
        <div className="divide-y">
          {displayList.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 py-2.5">
              {editingId === a.id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") rename(a.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 rounded-lg border px-2 py-1 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={() => rename(a.id)}
                    className="rounded-md p-1.5 text-success hover:bg-success/10"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-md p-1.5 text-muted hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <ShieldCheck
                      className={`h-4 w-4 shrink-0 ${a.isOwner ? "text-primary" : "text-muted"}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {a.name ?? a.email}
                        {a.isOwner && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Owner
                          </span>
                        )}
                      </p>
                      {a.name && (
                        <p className="text-xs text-muted truncate">{a.email}</p>
                      )}
                    </div>
                  </div>

                  {!a.isOwner && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(a.id);
                          setEditName(a.name ?? "");
                        }}
                        className="shrink-0 rounded-md p-1.5 text-muted hover:bg-background"
                        title="Rename"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(a.id)}
                        className="shrink-0 rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                        title="Remove admin access"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
