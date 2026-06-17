"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Upload, Sparkles } from "lucide-react";
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

interface Issue {
  id: string;
  subject: string;
  type: string;
  topic: string;
  difficulty: string;
  stem: string;
  answer: string;
  options: string[] | null;
  issueType:
    | "answer_not_in_options"
    | "too_few_options"
    | "duplicate_options"
    | "answer_echoes_stem"
    | "short_stem"
    | "option_is_label";
  detail: string;
}

interface AuditResult {
  total: number;
  issueCount: number;
  issues: Issue[];
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
  const [withExplanation, setWithExplanation] = useState<number | null>(null);
  const [tab, setTab] = useState<"add" | "import" | "browse" | "audit" | "stats">("add");

  // Stats tab
  interface QuestionStat {
    questionId: string;
    total: number;
    correct: number;
    successRate: number;
    question: { id: string; stem: string; topic: string; subject: string; difficulty: string };
  }
  const [statsData, setStatsData] = useState<QuestionStat[] | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

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

  // Dedup
  const [dedupMsg, setDedupMsg] = useState<string | null>(null);
  const [dedupRunning, setDedupRunning] = useState(false);

  // Audit
  const [auditResults, setAuditResults] = useState<AuditResult | null>(null);
  const [auditRunning, setAuditRunning] = useState(false);

  const load = () => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((d) => {
        setRows(d.questions);
        setCounts(d.counts);
        setWithExplanation(d.withExplanation ?? null);
      });
  };

  const loadStats = () => {
    setStatsLoading(true);
    fetch("/api/admin/question-stats")
      .then((r) => r.json())
      .then((d) => setStatsData(d.stats))
      .finally(() => setStatsLoading(false));
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

  const runDedup = async () => {
    setDedupRunning(true);
    setDedupMsg(null);
    const res = await fetch("/api/admin/dedup", { method: "POST" });
    const b = await res.json();
    if (res.ok) {
      setDedupMsg(`✓ Removed ${b.removed} duplicate${b.removed !== 1 ? "s" : ""}. ${b.remaining} questions remain.`);
      load();
    } else {
      setDedupMsg(`✗ ${b.error}`);
    }
    setDedupRunning(false);
  };

  const runAudit = async () => {
    setAuditRunning(true);
    const res = await fetch("/api/admin/quality-scan", { method: "POST" });
    const b = await res.json();
    if (res.ok) {
      setAuditResults(b as AuditResult);
    }
    setAuditRunning(false);
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
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">
            Bank coverage
            {counts.length > 0 && (
              <span className="ml-2 font-normal text-muted">
                ({counts.reduce((s, c) => s + c._count, 0)} total
                {withExplanation !== null && counts.length > 0 && (
                  <span className={withExplanation / counts.reduce((s, c) => s + c._count, 0) < 0.5 ? " text-danger" : " text-success"}>
                    {" · "}{Math.round((withExplanation / counts.reduce((s, c) => s + c._count, 0)) * 100)}% with explanations
                  </span>
                )}
                )
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {dedupMsg && <span className="text-xs text-muted">{dedupMsg}</span>}
            <Button variant="outline" size="sm" onClick={runDedup} disabled={dedupRunning}>
              <Sparkles className="h-3.5 w-3.5" />
              {dedupRunning ? "Running…" : "Remove duplicates"}
            </Button>
          </div>
        </div>
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
            ["audit", "Audit"],
            ["stats", "Usage stats"],
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
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap gap-2 text-xs text-muted">
                    <span>{q.subject}</span>
                    <span>·</span>
                    <span>{q.topic}</span>
                    <span>·</span>
                    <span>{q.difficulty}</span>
                    <span>·</span>
                    <span className="font-medium text-foreground">{q.type === "SHORT_ANSWER" ? "SA" : "MCQ"}</span>
                  </div>
                  <p className="line-clamp-2">{q.stem}</p>
                  <p className="mt-0.5 truncate text-xs text-success">
                    ✓ {(() => {
                      try {
                        const p = JSON.parse(q.answer);
                        if (Array.isArray(p) && p.length > 0) return p[0];
                      } catch {}
                      return q.answer;
                    })()}
                  </p>
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

      {tab === "audit" && (
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={runAudit} disabled={auditRunning}>
              {auditRunning ? "Scanning…" : "Run audit"}
            </Button>
            {auditResults && (
              <span className="text-sm text-muted">
                {auditResults.issueCount} issue{auditResults.issueCount !== 1 ? "s" : ""} found across {auditResults.total} questions
              </span>
            )}
          </div>
          {auditResults && auditResults.issueCount > 0 && (
            <div className="divide-y">
              {auditResults.issues.map((issue) => (
                <div
                  key={`${issue.id}-${issue.issueType}`}
                  className="flex items-start justify-between gap-3 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>{issue.subject}</span>
                      <span>·</span>
                      <span>{issue.topic}</span>
                      <span>·</span>
                      <span>{issue.difficulty}</span>
                      <span>·</span>
                      <IssueBadge type={issue.issueType} />
                    </div>
                    <p className="truncate">{issue.stem.slice(0, 80)}{issue.stem.length > 80 ? "…" : ""}</p>
                    <p className="mt-0.5 text-xs text-muted">{issue.detail}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await remove(issue.id);
                      await runAudit();
                    }}
                    className="shrink-0 rounded-md p-1.5 text-danger hover:bg-danger/10"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {auditResults && auditResults.issueCount === 0 && (
            <p className="text-sm text-muted">No issues found.</p>
          )}
        </Card>
      )}

      {tab === "stats" && (
        <Card className="space-y-4">
          {!statsData && (
            <Button onClick={loadStats} disabled={statsLoading}>
              {statsLoading ? "Loading…" : "Load usage stats"}
            </Button>
          )}
          {statsData && statsData.length === 0 && (
            <p className="text-sm text-muted">No attempt data yet — take a mock first.</p>
          )}
          {statsData && statsData.length > 0 && (
            <>
              <div>
                <h4 className="mb-2 text-sm font-semibold">Most attempted</h4>
                <div className="divide-y text-sm">
                  {statsData.slice(0, 20).map((s) => (
                    <div key={s.questionId} className="flex items-start gap-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-muted">{s.question.topic} · {s.question.difficulty}</p>
                        <p className="mt-0.5 line-clamp-1">{s.question.stem.slice(0, 90)}{s.question.stem.length > 90 ? "…" : ""}</p>
                      </div>
                      <div className="shrink-0 text-right text-xs tabular-nums">
                        <div className="font-medium">{s.total} uses</div>
                        <div className={s.successRate < 40 ? "text-danger" : s.successRate < 70 ? "text-warning" : "text-success"}>
                          {s.successRate}% correct
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold">Hardest questions <span className="font-normal text-muted">(min 3 attempts)</span></h4>
                <div className="divide-y text-sm">
                  {[...statsData]
                    .filter((s) => s.total >= 3)
                    .sort((a, b) => a.successRate - b.successRate)
                    .slice(0, 10)
                    .map((s) => (
                      <div key={s.questionId} className="flex items-start gap-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-muted">{s.question.topic} · {s.question.difficulty}</p>
                          <p className="mt-0.5 line-clamp-1">{s.question.stem.slice(0, 90)}{s.question.stem.length > 90 ? "…" : ""}</p>
                        </div>
                        <div className="shrink-0 text-right text-xs tabular-nums">
                          <div className="font-medium text-danger">{s.successRate}% correct</div>
                          <div className="text-muted">{s.total} uses</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
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

const ISSUE_LABELS: Record<string, string> = {
  answer_not_in_options: "answer not in options",
  too_few_options: "too few options",
  duplicate_options: "duplicate options",
  answer_echoes_stem: "answer echoes stem",
  short_stem: "short stem",
  option_is_label: "option is label",
};

const ISSUE_TONES: Record<string, "danger" | "warning" | "muted"> = {
  answer_not_in_options: "danger",
  too_few_options: "danger",
  option_is_label: "danger",
  duplicate_options: "warning",
  answer_echoes_stem: "warning",
  short_stem: "muted",
};

function IssueBadge({ type }: { type: string }) {
  return (
    <Badge tone={ISSUE_TONES[type] ?? "muted"}>
      {ISSUE_LABELS[type] ?? type}
    </Badge>
  );
}
