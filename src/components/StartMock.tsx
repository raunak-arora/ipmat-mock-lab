"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2 } from "lucide-react";
import { EXAMS, Exam, Mode, SectionKey } from "@/lib/examConfig";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
}

export default function StartMock() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [exam, setExam] = useState<Exam>("INDORE");
  const [mode, setMode] = useState<Mode>("FULL");
  const [scopeSection, setScopeSection] = useState<SectionKey | "">("");
  const [scopeTopic, setScopeTopic] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((p: Profile[]) => {
        setProfiles(p);
        if (p[0]) setProfileId(p[0].id);
      })
      .catch(() => {});
  }, []);

  const config = EXAMS[exam];
  const sectionOptions = config.sections;
  const activeSection =
    sectionOptions.find((s) => s.key === scopeSection) ?? sectionOptions[0];

  const start = async () => {
    setError(null);
    setLoading(true);
    try {
      let pid = profileId;
      if (!pid && newName.trim()) {
        const res = await fetch("/api/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName.trim() }),
        });
        const profile = await res.json();
        pid = profile.id;
      }
      if (!pid) {
        setError("Pick or create a profile first.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: pid,
          exam,
          mode,
          scopeSection: mode !== "FULL" ? scopeSection || activeSection.key : undefined,
          scopeTopic: mode === "TOPIC" ? scopeTopic || undefined : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not start the mock.");
        setLoading(false);
        return;
      }
      const { attemptId } = await res.json();
      router.push(`/mock/${attemptId}`);
    } catch {
      setError("Something went wrong. Is the database seeded?");
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Start a new mock</h2>
        <p className="text-sm text-muted">
          Pick the exam and mode, then begin a timed attempt.
        </p>
      </div>

      {/* Profile */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Who is taking this?</label>
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProfileId(p.id);
                setNewName("");
              }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm",
                profileId === p.id && !newName
                  ? "border-primary bg-primary/5"
                  : "hover:bg-background"
              )}
            >
              {p.name}
            </button>
          ))}
          <input
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setProfileId("");
            }}
            placeholder="+ new name"
            className="w-32 rounded-lg border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Exam */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Exam</label>
        <div className="grid grid-cols-2 gap-2">
          {(["INDORE", "ROHTAK"] as Exam[]).map((e) => (
            <button
              key={e}
              onClick={() => {
                setExam(e);
                setScopeSection("");
                setScopeTopic("");
              }}
              className={cn(
                "rounded-lg border p-3 text-left text-sm transition",
                exam === e ? "border-primary bg-primary/5" : "hover:bg-background"
              )}
            >
              <div className="font-semibold">{EXAMS[e].label}</div>
              <div className="text-xs text-muted">
                {EXAMS[e].totalQuestions} Qs · {EXAMS[e].totalMarks} marks ·{" "}
                {EXAMS[e].durationMin} min
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["FULL", "Full mock"],
              ["SECTIONAL", "One section"],
              ["TOPIC", "Topic practice"],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition",
                mode === m ? "border-primary bg-primary/5" : "hover:bg-background"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scope */}
      {mode !== "FULL" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Section</label>
            <select
              value={scopeSection || activeSection.key}
              onChange={(e) => {
                setScopeSection(e.target.value as SectionKey);
                setScopeTopic("");
              }}
              className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
            >
              {sectionOptions.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {mode === "TOPIC" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Topic</label>
              <select
                value={scopeTopic}
                onChange={(e) => setScopeTopic(e.target.value)}
                className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <option value="">Any topic</option>
                {activeSection.topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button size="lg" onClick={start} disabled={loading} className="w-full">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Play className="h-5 w-5" />
        )}
        {loading ? "Preparing…" : "Start mock"}
      </Button>
    </Card>
  );
}
