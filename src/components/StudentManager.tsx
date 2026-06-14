"use client";

import { useEffect, useState } from "react";
import { Trash2, UserPlus, Pencil, Check, X } from "lucide-react";
import { Card } from "@/components/ui";

interface Student {
  id: string;
  email: string;
  name: string | null;
  addedAt: string;
}

export default function StudentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    const res = await fetch("/api/students");
    if (res.ok) setStudents(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!email.trim()) { setError("Email is required."); return; }
    setError(null);
    setLoading(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() || null }),
    });
    setLoading(false);
    if (res.ok) { setEmail(""); setName(""); load(); }
    else { const b = await res.json(); setError(b.error ?? "Failed to add."); }
  }

  async function rename(id: string) {
    await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() || null }),
    });
    setEditingId(null);
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      {/* Add form */}
      <Card className="space-y-3">
        <h3 className="font-semibold">Add student access</h3>
        <p className="text-sm text-muted">
          Only students whose Google email is on this list can sign in and take mocks.
        </p>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="student@gmail.com"
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

      {/* Student list */}
      <Card>
        <h3 className="mb-3 font-semibold">
          Allowed students{" "}
          <span className="text-sm font-normal text-muted">({students.length})</span>
        </h3>
        {students.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No students added yet.</p>
        ) : (
          <div className="divide-y">
            {students.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 gap-2">
                {editingId === s.id ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") rename(s.id); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 rounded-lg border px-2 py-1 text-sm focus:border-primary focus:outline-none"
                    />
                    <button onClick={() => rename(s.id)} className="rounded-md p-1.5 text-success hover:bg-success/10"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingId(null)} className="rounded-md p-1.5 text-muted hover:bg-background"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name ?? s.email}</p>
                      {s.name && <p className="text-xs text-muted">{s.email}</p>}
                    </div>
                    <button
                      onClick={() => { setEditingId(s.id); setEditName(s.name ?? ""); }}
                      className="rounded-md p-1.5 text-muted hover:bg-background"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(s.id)} className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
