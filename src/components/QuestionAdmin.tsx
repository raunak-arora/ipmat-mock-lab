"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { QA_TOPICS, VA_TOPICS, LR_TOPICS, Subject } from "@/lib/examConfig";

interface QuestionRow {
  id: string;
  subject: string;
  type: string;
  topic: string;
  difficulty: string;
  stem: string;
  options: string[] | null;
  answer: string;
}

const TOPICS: Record<Subject, readonly string[]> = {
  QUANT: QA_TOPICS,
  VERBAL: VA_TOPICS,
  LR: LR_TOPICS,
};

const EXAMPLE = JSON.stringify(
  [
    {
      subject: "QUANT",
      type: "MCQ",
      topic: "Arithmetic",
      difficulty: "EASY",
      stem: "What is 10% of 250?",
      options: ["20", "25", "30", "35"],
      answer: "25",
      explanation: "0.1 × 250 = 25.",
    },
  ],
  null,
  2
);

export default function QuestionAdmin() {
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [counts, setCounts] = useState<
    { subject: string; type: string; _count: number }[]
  >([]);
  const [tab, setTab] = useState<"add" | "import" | "browse">("add");

  // Add form
  const [subject, setSubject] = useState<Subject>("QUANT");
  const [type, setType] = useState<"MCQ" | "SHORT_ANSWER">("MCQ");
  const [topic, setTopic] = useState<string>(QA_TOPICS[0]);
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [stem, setStem] = useState("");
  const [passage, setPassage] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // Import
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const load = () => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((d) => {
        setRows(d.questions);
        setCounts(d.counts);
      });
  };
  useEffect(load, []);

  const resetForm = () => {
    setStem("");
    setPassage("");
    setOptions(["", "", "", ""]);
    setAnswer("");
    setExplanation("");
  };

  const submit = async () => {
    setMsg(null);
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    const payload = {
      subject,
      type,
      topic,
      difficulty,
      stem,
      passage: passage || undefined,
      options: type === "MCQ" ? cleanOptions : undefined,
      answer,
      explanation: explanation || undefined,
    };
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMsg("✓ Question added.");
      resetForm();
      load();
    } else {
      const b = await res.json();
      setMsg(`✗ ${b.error}`);
    }
  };

  const runImport = async () => {
    setImportMsg(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch {
      setImportMsg("✗ Invalid JSON.");
      return;
    }
    const res = await fetch("/api/questions/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    const b = await res.json();
    if (res.ok) {
      setImportMsg(
        `✓ Imported ${b.inserted}. Skipped ${b.skipped}.` +
          (b.errors?.length ? ` (${b.errors.slice(0, 3).join("; ")})` : "")
      );
      setImportText("");
      load();
    } else {
      setImportMsg(`✗ ${b.error}`);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const b = await res.json();
      alert(b.error);
    }
  };

  return (
    <div className="space-y-5">
      {/* Coverage */}
      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold">Bank coverage</h3>
        <div className="flex flex-wrap gap-2">
          {counts.map((c) => (
            <Badge key={`${c.subject}-${c.type}`} tone="primary">
              {c.subject} / {c.type}: {c._count}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        {(
          [
            ["add", "Add question"],
            ["import", "Bulk import"],
            ["browse", "Browse / delete"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              tab === t ? "border-primary bg-primary/5" : "hover:bg-card"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "add" && (
        <Card className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Subject">
              <select
                value={subject}
                onChange={(e) => {
                  const s = e.target.value as Subject;
                  setSubject(s);
                  setTopic(TOPICS[s][0]);
                  if (s === "LR") setType("MCQ");
                }}
                className="select"
              >
                <option value="QUANT">Quant</option>
                <option value="VERBAL">Verbal</option>
                <option value="LR">Logical Reasoning</option>
              </select>
            </Field>
            <Field label="Type">
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "MCQ" | "SHORT_ANSWER")
                }
                className="select"
              >
                <option value="MCQ">MCQ</option>
                <option value="SHORT_ANSWER">Short answer</option>
              </select>
            </Field>
            <Field label="Topic">
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="select"
              >
                {TOPICS[subject].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Difficulty">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="select"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </Field>
          </div>

          <Field label="Passage (optional, for reading comprehension)">
            <textarea
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              rows={2}
              className="input"
            />
          </Field>

          <Field label="Question stem">
            <textarea
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              rows={2}
              className="input"
            />
          </Field>

          {type === "MCQ" ? (
            <Field label="Options (select the correct one)">
              <div className="space-y-2">
                {options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={answer === o && o !== ""}
                      onChange={() => setAnswer(o)}
                    />
                    <input
                      value={o}
                      onChange={(e) => {
                        const next = [...options];
                        const prev = next[i];
                        next[i] = e.target.value;
                        setOptions(next);
                        if (answer === prev) setAnswer(e.target.value);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="input flex-1"
                    />
                  </div>
                ))}
              </div>
            </Field>
          ) : (
            <Field label="Correct answer">
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="e.g. 42"
                className="input max-w-xs"
              />
            </Field>
          )}

          <Field label="Explanation (optional)">
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              className="input"
            />
          </Field>

          {msg && <p className="text-sm text-muted">{msg}</p>}
          <Button onClick={submit}>
            <Plus className="h-4 w-4" />
            Add question
          </Button>
        </Card>
      )}

      {tab === "import" && (
        <Card className="space-y-3">
          <p className="text-sm text-muted">
            Paste a JSON array of questions. Same format as the seed bank:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-background p-3 text-xs text-muted">
            {EXAMPLE}
          </pre>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            placeholder="[ { ... }, { ... } ]"
            className="input font-mono text-xs"
          />
          {importMsg && <p className="text-sm text-muted">{importMsg}</p>}
          <Button onClick={runImport}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </Card>
      )}

      {tab === "browse" && (
        <Card>
          <p className="mb-3 text-sm text-muted">{rows.length} questions</p>
          <div className="divide-y">
            {rows.map((q) => (
              <div
                key={q.id}
                className="flex items-start justify-between gap-3 py-2.5 text-sm"
              >
                <div>
                  <div className="mb-0.5 flex gap-2 text-xs text-muted">
                    <span>{q.subject}</span>
                    <span>·</span>
                    <span>{q.topic}</span>
                    <span>·</span>
                    <span>{q.difficulty}</span>
                  </div>
                  <p className="line-clamp-2">{q.stem}</p>
                </div>
                <button
                  onClick={() => remove(q.id)}
                  className="shrink-0 rounded-md p-1.5 text-danger hover:bg-danger/10"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <style>{`
        .input { width: 100%; border: 1px solid var(--border); border-radius: 0.5rem; background: var(--card); padding: 0.5rem 0.75rem; font-size: 0.875rem; }
        .input:focus { outline: none; border-color: var(--primary); }
        .select { width: 100%; border: 1px solid var(--border); border-radius: 0.5rem; background: var(--card); padding: 0.5rem 0.75rem; font-size: 0.875rem; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
