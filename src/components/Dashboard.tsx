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
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
}

interface SeriesPoint {
  id: string;
  index: number;
  exam: string;
  mode: string;
  rawScore: number;
  maxScore: number;
  scorePct: number;
  percentile: number;
  clearedCutoff: boolean;
}

interface DashboardData {
  series: SeriesPoint[];
  topics: { topic: string; correct: number; total: number; pct: number }[];
  summary: {
    completed: number;
    avgPercentile: number;
    bestScore: number;
    clearRate: number;
  };
}

export default function Dashboard({ profiles }: { profiles: Profile[] }) {
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/dashboard?profileId=${profileId}`);
        const d = await r.json();
        if (!cancelled) setData(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (profiles.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          No profiles yet. Take a mock from the{" "}
          <Link href="/" className="text-primary hover:underline">
            home page
          </Link>{" "}
          first.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Profile:</span>
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => setProfileId(p.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm",
              profileId === p.id ? "border-primary bg-primary/5" : "hover:bg-card"
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
            No completed mocks for this profile yet.
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
            <Tile label="Cut-off clear rate" value={`${data.summary.clearRate}%`} />
          </div>

          {/* Trend chart */}
          <Card>
            <h3 className="mb-3 font-semibold">Progress over attempts</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="index"
                    stroke="var(--muted)"
                    fontSize={12}
                    label={{ value: "Attempt", position: "insideBottom", offset: -2, fontSize: 11 }}
                  />
                  <YAxis stroke="var(--muted)" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentile"
                    name="Percentile"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scorePct"
                    name="Score %"
                    stroke="var(--success)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Topic heatmap */}
          <Card>
            <h3 className="mb-1 font-semibold">Topic strengths &amp; weaknesses</h3>
            <p className="mb-3 text-xs text-muted">
              Across all attempts — weakest topics first.
            </p>
            <div className="space-y-1.5">
              {data.topics.map((t) => (
                <div key={t.topic} className="flex items-center gap-3 text-sm">
                  <span className="w-48 shrink-0 truncate">{t.topic}</span>
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

          {/* Attempt list */}
          <Card>
            <h3 className="mb-3 font-semibold">All attempts</h3>
            <div className="divide-y">
              {[...data.series].reverse().map((s) => (
                <Link
                  key={s.id}
                  href={`/results/${s.id}`}
                  className="flex items-center justify-between py-2.5 text-sm hover:opacity-80"
                >
                  <span className="text-muted">
                    #{s.index} · {s.exam} · {s.mode}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">
                      {s.rawScore}/{s.maxScore}
                    </span>
                    <Badge tone={s.clearedCutoff ? "success" : "danger"}>
                      {s.percentile.toFixed(1)}%ile
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
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
