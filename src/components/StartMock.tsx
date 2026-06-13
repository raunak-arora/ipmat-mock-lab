"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2 } from "lucide-react";
import { EXAMS, Exam, Mode, SectionKey } from "@/lib/examConfig";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Props {
  profileId: string;
  profileName: string;
}

export default function StartMock({ profileId, profileName }: Props) {
  const router = useRouter();

  const [exam, setExam] = useState<Exam>("INDORE");
  const [mode, setMode] = useState<Mode>("FULL");
  const [scopeSection, setScopeSection] = useState<SectionKey | "">("");
  const [scopeTopic, setScopeTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = EXAMS[exam];
  const sectionOptions = config.sections;
  const activeSection = sectionOptions.find((s) => s.key === scopeSection) ?? sectionOptions[0];

  const start = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
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
      setError("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Start a new mock</h2>
        <p className="text-sm text-muted">
          Taking as <span className="font-medium text-foreground">{profileName}</span>
        </p>
      </div>

      {/* Exam */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Exam</label>
        <div className="grid grid-cols-2 gap-2">
          {(["INDORE", "ROHTAK"] as Exam[]).map((e) => (
            <button
              key={e}
              onClick={() => { setExam(e); setScopeSection(""); setScopeTopic(""); }}
              className={cn(
                "rounded-lg border p-3 text-left text-sm transition",
                exam === e ? "border-primary bg-primary/5" : "hover:bg-background"
              )}
            >
              <div className="font-semibold">{EXAMS[e].label}</div>
              <div className="text-xs text-muted">
                {EXAMS[e].totalQuestions} Qs · {EXAMS[e].totalMarks} marks · {EXAMS[e].durationMin} min
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {([["FULL", "Full mock"], ["SECTIONAL", "One section"], ["TOPIC", "Topic practice"]] as [Mode, string][]).map(([m, label]) => (
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
              onChange={(e) => { setScopeSection(e.target.value as SectionKey); setScopeTopic(""); }}
              className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
            >
              {sectionOptions.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
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
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button size="lg" onClick={start} disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
        {loading ? "Preparing…" : "Start mock"}
      </Button>
    </Card>
  );
}
