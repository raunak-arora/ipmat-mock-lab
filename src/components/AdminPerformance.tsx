"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { EXAMS, SECTION_LABELS, type SectionKey } from "@/lib/examConfig";

interface Profile {
  id: string;
  name: string;
}

interface SectionScoreData {
  score: number;
  max: number;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  cutoff: number;
  clearedCutoff: boolean;
}

interface AttemptRow {
  id: string;
  index: number;
  profileName: string;
  profileId: string;
  exam: string;
  mode: string;
  date: string | null;
  rawScore: number;
  maxScore: number;
  scorePct: number;
  percentile: number;
  clearedCutoff: boolean;
  sectionScores: Record<string, SectionScoreData>;
  sectionTimes: Record<string, number>;
}

interface AdminData {
  series: AttemptRow[];
  topics: { topic: string; correct: number; total: number; pct: number }[];
  summary: {
    completed: number;
    avgPercentile: number;
    bestScore: number;
    clearRate: number;
  };
}

function fmtTime(sec: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPerformance() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  // "" = all students (aggregate); a profile id = filter to that student
  const [profileId, setProfileId] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Load profiles once on mount, then immediately load aggregate data.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((ps: Profile[]) => { if (!cancelled) setProfiles(ps); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const url = profileId
          ? `/api/admin/performance?profileId=${profileId}`
          : "/api/admin/performance";
        const r = await fetch(url);
        const d = await r.json();
        if (!cancelled) { setData(d); setExpanded(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [profileId]);

  return (
    <div className="space-y-5">
      {/* Student filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Showing:</span>
        <button
          onClick={() => setProfileId("")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm",
            profileId === "" ? "border-primary bg-primary/5 font-medium" : "hover:bg-card"
          )}
        >
          All students
        </button>
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => setProfileId(p.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm",
              profileId === p.id ? "border-primary bg-primary/5 font-medium" : "hover:bg-card"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}

      {data && data.summary.completed === 0 && (
        <Card>
          <p className="text-sm text-muted">
            {profileId
              ? "No completed mocks for this student yet."
              : "No completed mocks yet — have a student take a mock first."}
          </p>
        </Card>
      )}

      {data && data.summary.completed > 0 && (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="Mocks taken" value={String(data.summary.completed)} />
            <Tile
              label="Avg percentile"
              value={data.summary.avgPercentile.toFixed(1)}
              accent
            />
            <Tile label="Best score" value={String(data.summary.bestScore)} />
            <Tile
              label="Cut-off clear rate"
              value={`${data.summary.clearRate}%`}
            />
          </div>

          {/* Trend chart */}
          <Card>
            <h3 className="mb-3 font-semibold">Score &amp; percentile trend</h3>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="index"
                    stroke="var(--muted)"
                    fontSize={11}
                    tickLine={false}
                    label={{
                      value: "Attempt #",
                      position: "insideBottom",
                      offset: -2,
                      fontSize: 10,
                    }}
                  />
                  <YAxis stroke="var(--muted)" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v, name) => [
                      `${v}${name === "Percentile" ? "" : "%"}`,
                      name,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentile"
                    name="Percentile"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--primary)" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scorePct"
                    name="Score %"
                    stroke="var(--success)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--success)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Section performance + topic heatmap */}
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionAvgCard series={data.series} profileId={profileId} />
            <TopicCard topics={data.topics} />
          </div>

          {/* Attempt history with expandable section + time detail */}
          <Card>
            <h3 className="mb-3 font-semibold">Attempt history</h3>
            <div className="divide-y">
              {[...data.series].reverse().map((row) => (
                <div key={row.id}>
                  <button
                    className="flex w-full items-center justify-between py-2.5 text-sm hover:opacity-80"
                    onClick={() =>
                      setExpanded(expanded === row.id ? null : row.id)
                    }
                  >
                    <div className="flex items-center gap-2 text-left">
                      {expanded === row.id ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                      )}
                      <span className="text-muted">
                        {!profileId && <span className="font-medium text-foreground">{row.profileName} · </span>}
                        #{row.index} · {EXAMS[row.exam as "INDORE" | "ROHTAK"].label} ·{" "}
                        {row.mode}
                      </span>
                      <span className="hidden text-xs text-muted sm:inline">
                        · {fmtDate(row.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums">
                        {row.rawScore}/
                        {row.mode === "FULL"
                          ? row.maxScore
                          : Object.values(row.sectionScores)
                              .filter((ss) => ss.correct + ss.wrong + ss.skipped > 0)
                              .reduce((s, ss) => s + ss.max, 0) || row.maxScore}
                      </span>
                      <Badge tone={row.clearedCutoff ? "success" : "danger"}>
                        {row.percentile.toFixed(1)}%ile
                      </Badge>
                    </div>
                  </button>

                  {expanded === row.id && (
                    <div className="mb-2 ml-6 space-y-1 pb-1">
                      {/* Section breakdown with time */}
                      <div className="overflow-x-auto rounded-lg border text-xs">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-background text-muted">
                              <th className="px-3 py-2 text-left">Section</th>
                              <th className="px-3 py-2 text-right">Score</th>
                              <th className="px-3 py-2 text-right">Correct</th>
                              <th className="px-3 py-2 text-right">Wrong</th>
                              <th className="px-3 py-2 text-right">Skipped</th>
                              <th className="px-3 py-2 text-right">Time spent</th>
                              <th className="px-3 py-2 text-right">Cut-off</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(row.sectionScores)
                              .filter(([, ss]) => ss.correct + ss.wrong + ss.skipped > 0)
                              .map(([key, ss]) => (
                                <tr key={key} className="border-b last:border-0">
                                  <td className="px-3 py-2 font-medium">
                                    {SECTION_LABELS[key as SectionKey] ?? key}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    {ss.score}/{ss.max}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-success">
                                    {ss.correct}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-danger">
                                    {ss.wrong}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-muted">
                                    {ss.skipped}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    {fmtTime(row.sectionTimes[key] ?? 0)}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span
                                      className={
                                        ss.clearedCutoff
                                          ? "text-success"
                                          : "text-danger"
                                      }
                                    >
                                      {ss.score} / {ss.cutoff}{" "}
                                      {ss.clearedCutoff ? "✓" : "✗"}
                                    </span>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                      <Link
                        href={`/results/${row.id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Full solution review <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/** Section averages across FULL mocks only — the evaluator's key view. */
function SectionAvgCard({
  series,
  profileId,
}: {
  series: AttemptRow[];
  profileId: string;
}) {
  // When profileId is "" (all students), show full mocks from everyone.
  const fullMocks = series.filter(
    (s) => s.mode === "FULL" && (profileId === "" || s.profileId === profileId)
  );

  if (fullMocks.length === 0) {
    return (
      <Card>
        <h3 className="mb-2 font-semibold">Section averages</h3>
        <p className="text-xs text-muted">
          No full mocks yet — section averages appear after the first complete
          mock.
        </p>
      </Card>
    );
  }

  // Collect section keys from all full attempts.
  const sectionKeys = [
    ...new Set(fullMocks.flatMap((a) => Object.keys(a.sectionScores))),
  ];

  const rows = sectionKeys.map((key) => {
    const attempts = fullMocks.filter((a) => key in a.sectionScores);
    const avg = <T,>(fn: (a: AttemptRow) => T extends number ? number : never) =>
      (attempts.reduce((s, a) => s + (fn(a) as unknown as number), 0) /
        attempts.length) as number;

    const avgScore = avg((a) => a.sectionScores[key].score as never);
    const avgMax = avg((a) => a.sectionScores[key].max as never);
    const avgAccuracy = avg(
      (a) =>
        Math.round(
          (a.sectionScores[key].correct /
            (a.sectionScores[key].correct +
              a.sectionScores[key].wrong +
              a.sectionScores[key].skipped || 1)) *
            100
        ) as never
    );
    const avgTimeSec = avg((a) => (a.sectionTimes[key] ?? 0) as never);
    const clearCount = attempts.filter(
      (a) => a.sectionScores[key].clearedCutoff
    ).length;
    const cutoff = fullMocks[0].sectionScores[key]?.cutoff ?? 0;

    // Look up time limit by section key across all exams (safe for mixed-exam aggregate).
    const timeLimitMin =
      Object.values(EXAMS)
        .flatMap((e) => e.sections)
        .find((s) => s.key === key)?.timeLimitMin ?? null;

    return {
      key,
      label: SECTION_LABELS[key as SectionKey] ?? key,
      avgScore: Math.round(avgScore),
      avgMax: Math.round(avgMax),
      avgAccuracy: Math.round(avgAccuracy),
      avgTimeSec: Math.round(avgTimeSec),
      clearRate: Math.round((clearCount / attempts.length) * 100),
      cutoff,
      timeLimitMin,
    };
  });

  return (
    <Card>
      <h3 className="mb-1 font-semibold">Section averages</h3>
      <p className="mb-3 text-xs text-muted">
        Across {fullMocks.length} full mock{fullMocks.length > 1 ? "s" : ""}.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted">
              <th className="pb-1.5 text-left">Section</th>
              <th className="pb-1.5 text-right">Avg score</th>
              <th className="pb-1.5 text-right">Accuracy</th>
              <th className="pb-1.5 text-right">Avg time</th>
              <th className="pb-1.5 text-right">Cut-off</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b last:border-0">
                <td className="py-2 pr-2 font-medium">{r.label}</td>
                <td className="py-2 text-right tabular-nums">
                  {r.avgScore}/{r.avgMax}
                </td>
                <td className="py-2 text-right tabular-nums">
                  <span
                    className={
                      r.avgAccuracy >= 70
                        ? "text-success"
                        : r.avgAccuracy >= 40
                          ? "text-warning"
                          : "text-danger"
                    }
                  >
                    {r.avgAccuracy}%
                  </span>
                </td>
                <td className="py-2 text-right tabular-nums">
                  {fmtTime(r.avgTimeSec)}
                  {r.timeLimitMin !== null && (
                    <span className="ml-1 text-muted">
                      / {r.timeLimitMin}m
                    </span>
                  )}
                </td>
                <td className="py-2 text-right">
                  <span
                    className={
                      r.clearRate === 100
                        ? "text-success"
                        : r.clearRate >= 50
                          ? "text-warning"
                          : "text-danger"
                    }
                  >
                    {r.clearRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TopicCard({
  topics,
}: {
  topics: { topic: string; correct: number; total: number; pct: number }[];
}) {
  return (
    <Card>
      <h3 className="mb-1 font-semibold">Topic weaknesses</h3>
      <p className="mb-3 text-xs text-muted">Weakest topics first.</p>
      <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 260 }}>
        {topics.map((t) => (
          <div key={t.topic} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 truncate text-xs sm:w-44">{t.topic}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
              <div
                className={cn(
                  "h-full rounded-full",
                  t.pct >= 70
                    ? "bg-success"
                    : t.pct >= 40
                      ? "bg-warning"
                      : "bg-danger"
                )}
                style={{ width: `${t.pct}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted">
              {t.correct}/{t.total} ({t.pct}%)
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4 text-center">
      <div className="text-xs text-muted">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          accent && "text-primary"
        )}
      >
        {value}
      </div>
    </Card>
  );
}
