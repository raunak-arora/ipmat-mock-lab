"use client";

import { useEffect, useState } from "react";
import { Trash2, UserPlus, Pencil, Check, X } from "lucide-react";
import { Card } from "@/components/ui";

const ALL_EXAMS = [
  { key: "INDORE", label: "IPMAT Indore" },
  { key: "ROHTAK", label: "IPMAT Rohtak" },
  { key: "CAT", label: "CAT" },
] as const;

type ExamKey = (typeof ALL_EXAMS)[number]["key"];

interface Student {
  id: string;
  email: string;
  name: string | null;
  addedAt: string;
  allowedExams: string;
}

function parseExams(raw: string): ExamKey[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ExamKey[];
  } catch { /* */ }
  return ["INDORE", "ROHTAK"];
}

function ExamPills({
  selected,
  onToggle,
}: {
  selected: ExamKey[];
  onToggle: (key: ExamKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_EXAMS.map((e) => (
        <button
          key={e.key}
          onClick={() => onToggle(e.key)}
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
            selected.includes(e.key)
              ? "border-primary bg-primary/10 text-primary"
              : "text-muted hover:border-muted"
          }`}
        >
          {e.label}
        </button>
      ))}
    </div>
  );
}

export default function StudentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [newExams, setNewExams] = useState<ExamKey[]>(["INDORE", "ROHTAK"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editExams, setEditExams] = useState<ExamKey[]>([]);

  async function load() {
    const res = await fetch("/api/students");
    if (res.ok) setStudents(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!email.trim()) { setError("Email is required."); return; }
    if (newExams.length === 0) { setError("Select at least one exam."); return; }
    setError(null);
    setLoading(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        name: name.trim() || null,
        allowedExams: newExams,
      }),
    });
    setLoading(false);
    if (res.ok) { setEmail(""); setName(""); setNewExams(["INDORE", "ROHTAK"]); load(); }
    else { const b = await res.json(); setError(b.error ?? "Failed to add."); }
  }

  function startEdit(s: Student) {
    setEditingId(s.id);
    setEditName(s.name ?? "");
    setEditExams(parseExams(s.allowedExams));
  }

  async function save(id: string) {
    if (editExams.length === 0) return;
    await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() || null, allowedExams: editExams }),
    });
    setEditingId(null);
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    load();
  }

  function toggle(list: ExamKey[], key: ExamKey, set: (v: ExamKey[]) => void) {
    set(list.includes(key) ? list.filter((e) => e !== key) : [...list, key]);
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <h3 className="font-semibold">Add student access</h3>
        <p className="text-sm text-muted">
          Only whitelisted Google emails can sign in. Choose which exams each student can access.
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
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            Add
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Exam access:</span>
          <ExamPills selected={newExams} onToggle={(k) => toggle(newExams, k, setNewExams)} />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">
          Allowed students{" "}
          <span className="text-sm font-normal text-muted">({students.length})</span>
        </h3>
        {students.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No students added yet.</p>
        ) : (
          <div className="divide-y">
            {students.map((s) => {
              const exams = parseExams(s.allowedExams);
              return (
                <div key={s.id} className="py-3">
                  {editingId === s.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") save(s.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 rounded-lg border px-2 py-1 text-sm focus:border-primary focus:outline-none"
                        />
                        <button onClick={() => save(s.id)} className="rounded-md p-1.5 text-success hover:bg-success/10">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="rounded-md p-1.5 text-muted hover:bg-background">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted">Exams:</span>
                        <ExamPills selected={editExams} onToggle={(k) => toggle(editExams, k, setEditExams)} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{s.name ?? s.email}</p>
                        {s.name && <p className="text-xs text-muted">{s.email}</p>}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {exams.map((ek) => {
                            const ex = ALL_EXAMS.find((e) => e.key === ek);
                            return ex ? (
                              <span key={ek} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                {ex.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button onClick={() => startEdit(s)} className="rounded-md p-1.5 text-muted hover:bg-background">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(s.id)} className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
