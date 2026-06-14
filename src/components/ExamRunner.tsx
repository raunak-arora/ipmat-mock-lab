"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bookmark,
  Clock,
  Eraser,
  Lock,
  Send,
} from "lucide-react";
import { Exam, SectionKey, getExam } from "@/lib/examConfig";
import type { RunnerQuestion, SavedAnswer } from "@/lib/types";
import { formatClock, cn } from "@/lib/utils";
import { Button, Card } from "@/components/ui";

interface AttemptData {
  id: string;
  exam: Exam;
  mode: string;
  startedAt: string;
  serverNow: string;
  questions: RunnerQuestion[];
  saved: SavedAnswer[];
}

type Status = "unseen" | "seen" | "answered" | "marked";

interface AnswerState {
  given: string | null;
  status: Status;
}

export default function ExamRunner({ data }: { data: AttemptData }) {
  const router = useRouter();
  const config = getExam(data.exam);
  const sections = config.sections;
  const startedAtMs = Date.parse(data.startedAt);

  // Align the client clock to the server clock once, so a fast/slow local clock
  // can't grant or steal exam time. Computed lazily so it runs a single time.
  const [clockOffsetMs] = useState(
    () => Date.parse(data.serverNow) - Date.now()
  );

  const elapsedSec = useCallback(
    () => Math.floor((Date.now() + clockOffsetMs - startedAtMs) / 1000),
    [clockOffsetMs, startedAtMs]
  );

  // Group questions by section, preserving order.
  const bySection = useMemo(() => {
    const map = new Map<SectionKey, RunnerQuestion[]>();
    for (const s of sections) map.set(s.key, []);
    for (const q of data.questions) map.get(q.section)?.push(q);
    return map;
  }, [data.questions, sections]);

  // ----- answer state -----
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    const init: Record<string, AnswerState> = {};
    for (const q of data.questions) init[q.id] = { given: null, status: "unseen" };
    for (const s of data.saved) {
      init[s.questionId] = {
        given: s.given,
        status: (s.status as Status) ?? "unseen",
      };
    }
    // The first question is on screen from the start, so mark it seen.
    const first = data.questions[0];
    if (first && init[first.id].status === "unseen") {
      init[first.id] = { ...init[first.id], status: "seen" };
    }
    return init;
  });
  const timeRef = useRef<Record<string, number>>(
    Object.fromEntries(data.saved.map((s) => [s.questionId, s.timeSpentSec]))
  );
  const dirtyRef = useRef<Set<string>>(new Set());
  const submittedRef = useRef(false);

  const [, setTick] = useState(0);
  // For SECTIONAL/TOPIC mocks all questions belong to one section; start there.
  const initialSection = (data.questions[0]?.section ?? sections[0].key) as SectionKey;
  const [viewSection, setViewSection] = useState<SectionKey>(initialSection);
  // The user's last explicit question selection; the *displayed* question is
  // derived from it so a time-driven section change can't strand the view.
  const [selectedQId, setSelectedQId] = useState<string>(
    data.questions[0]?.id ?? ""
  );

  // ----- timing (recomputed every render; each tick re-renders) -----
  // For non-FULL mocks only one section is in scope — use its time limit.
  const effectiveTotalSec = useMemo(() => {
    if (data.mode !== "FULL") {
      const sectionKey = data.questions[0]?.section as SectionKey | undefined;
      const sec = sectionKey ? sections.find((s) => s.key === sectionKey) : null;
      return (
        (sec?.timeLimitMin ?? Math.round(config.durationMin / sections.length)) * 60
      );
    }
    return config.durationMin * 60;
  }, [data.mode, data.questions, sections, config.durationMin]);

  const computeTiming = () => {
    const e = elapsedSec();
    const totalSec = effectiveTotalSec;
    if (config.sectionalTiming) {
      let cum = 0;
      for (let i = 0; i < sections.length; i++) {
        const limit = (sections[i].timeLimitMin ?? 0) * 60;
        if (e < cum + limit) {
          return {
            activeIndex: i as number | null,
            sectionRemaining: (cum + limit - e) as number | null,
            globalRemaining: totalSec - e,
          };
        }
        cum += limit;
      }
      return {
        activeIndex: (sections.length - 1) as number | null,
        sectionRemaining: 0 as number | null,
        globalRemaining: 0,
      };
    }
    return {
      activeIndex: null as number | null,
      sectionRemaining: null as number | null,
      globalRemaining: totalSec - e,
    };
  };
  const timing = computeTiming();
  const activeSectionKey =
    timing.activeIndex != null ? sections[timing.activeIndex].key : null;

  // For Indore the viewable section is forced to the timer's active section;
  // for Rohtak the user picks freely.
  // Sectional locking only applies to FULL mocks — SECTIONAL/TOPIC have one fixed section.
  const effectiveSection =
    config.sectionalTiming && data.mode === "FULL" && activeSectionKey
      ? activeSectionKey
      : viewSection;
  const viewQuestions = bySection.get(effectiveSection) ?? [];
  // Resolve the displayed question, falling back to the first in the section if
  // the selection belongs to a section that has since locked.
  const currentQ =
    viewQuestions.find((q) => q.id === selectedQId) ?? viewQuestions[0];
  const cid = currentQ?.id ?? "";

  // Keep a ref of the displayed id so the 1s tick can accrue time without
  // reading reactive state in the interval closure.
  const cidRef = useRef(cid);
  useEffect(() => {
    cidRef.current = cid;
  }, [cid]);

  const persist = useCallback(async () => {
    const ids = [...dirtyRef.current];
    if (ids.length === 0) return;
    dirtyRef.current.clear();
    const payload = ids.map((id) => ({
      questionId: id,
      given: answers[id]?.given ?? null,
      status: answers[id]?.status ?? "unseen",
      timeSpentSec: timeRef.current[id] ?? 0,
    }));
    await fetch(`/api/attempts/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: payload }),
    }).catch(() => {});
  }, [answers, data.id]);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const payload = data.questions.map((q) => ({
      questionId: q.id,
      given: answers[q.id]?.given ?? null,
      status: answers[q.id]?.status ?? "unseen",
      timeSpentSec: timeRef.current[q.id] ?? 0,
    }));
    await fetch(`/api/attempts/${data.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: payload }),
    }).catch(() => {});
    router.push(`/results/${data.id}`);
  }, [answers, data.id, data.questions, router]);

  // 1-second tick: advance the clock display, accrue time to the displayed
  // question, and auto-submit when the global timer runs out.
  useEffect(() => {
    const interval = setInterval(() => {
      if (submittedRef.current) return;
      const e = elapsedSec();
      const id = cidRef.current;
      if (id && e < effectiveTotalSec) {
        timeRef.current[id] = (timeRef.current[id] ?? 0) + 1;
      }
      if (e >= effectiveTotalSec) submit();
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [elapsedSec, effectiveTotalSec, submit]);

  // Autosave every 10 seconds.
  useEffect(() => {
    const interval = setInterval(() => persist(), 10000);
    return () => clearInterval(interval);
  }, [persist]);

  // ----- handlers (mutations happen in events, not effects) -----
  const selectQuestion = (id: string) => {
    setSelectedQId(id);
    setAnswers((prev) => {
      const cur = prev[id];
      if (cur && cur.status === "unseen") {
        dirtyRef.current.add(id);
        return { ...prev, [id]: { ...cur, status: "seen" } };
      }
      return prev;
    });
  };

  const setGiven = (given: string | null) => {
    if (!cid) return;
    setAnswers((prev) => {
      const cur = prev[cid];
      const answered = !!given && given.trim() !== "";
      const status: Status =
        cur?.status === "marked" ? "marked" : answered ? "answered" : "seen";
      dirtyRef.current.add(cid);
      return { ...prev, [cid]: { given, status } };
    });
  };

  const toggleMark = () => {
    if (!cid) return;
    setAnswers((prev) => {
      const cur = prev[cid];
      const isMarked = cur?.status === "marked";
      const status: Status = isMarked
        ? cur?.given
          ? "answered"
          : "seen"
        : "marked";
      dirtyRef.current.add(cid);
      return { ...prev, [cid]: { ...cur, status } };
    });
  };

  const goNext = () => {
    const idx = viewQuestions.findIndex((q) => q.id === cid);
    if (idx >= 0 && idx < viewQuestions.length - 1) {
      selectQuestion(viewQuestions[idx + 1].id);
    }
  };

  const sectionLocked = (index: number) =>
    data.mode === "FULL" &&
    config.sectionalTiming &&
    timing.activeIndex != null &&
    index !== timing.activeIndex;

  const counts = useMemo(() => {
    let answered = 0;
    let marked = 0;
    for (const q of data.questions) {
      const a = answers[q.id];
      if (a?.status === "answered") answered++;
      else if (a?.status === "marked") marked++;
    }
    return { answered, marked };
  }, [answers, data.questions]);

  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!currentQ) return <div>Loading…</div>;

  const globalLow = timing.globalRemaining <= 300;
  const sectionLow =
    timing.sectionRemaining != null && timing.sectionRemaining <= 120;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* ---------------- Main panel ---------------- */}
      <div className="flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">
              {config.label}
            </span>
            <span className="text-muted">{data.mode} mock</span>
          </div>
          <div className="flex items-center gap-4">
            {data.mode === "FULL" && timing.sectionRemaining != null && (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums",
                  sectionLow ? "bg-danger/10 text-danger" : "bg-background"
                )}
              >
                <Clock className="h-4 w-4" />
                Section: {formatClock(timing.sectionRemaining)}
              </div>
            )}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums",
                globalLow ? "bg-danger/10 text-danger" : "bg-background"
              )}
            >
              <Clock className="h-4 w-4" />
              {data.mode === "FULL" ? "Total" : "Time"}: {formatClock(timing.globalRemaining)}
            </div>
          </div>
        </div>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted">
              {currentQ.topic}
            </span>
            <span className="text-sm text-muted">
              Q{viewQuestions.findIndex((q) => q.id === cid) + 1} of{" "}
              {viewQuestions.length}
            </span>
          </div>

          {currentQ.passage && (
            <div className="mb-4 max-h-64 overflow-y-auto rounded-lg border bg-background p-4 text-sm leading-relaxed text-foreground/90">
              {currentQ.passage}
            </div>
          )}

          <p className="whitespace-pre-line text-base leading-relaxed">
            {currentQ.stem}
          </p>

          <div className="mt-5 space-y-2">
            {currentQ.type === "MCQ" && currentQ.options ? (
              currentQ.options.map((opt, i) => {
                const selected = answers[cid]?.given === opt;
                return (
                  <label
                    key={i}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition hover:bg-background",
                      selected && "border-primary bg-primary/5"
                    )}
                  >
                    <input
                      type="radio"
                      name={cid}
                      checked={selected}
                      onChange={() => setGiven(opt)}
                      className="mt-0.5"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })
            ) : (
              <div>
                <label className="mb-1 block text-sm text-muted">
                  Type your answer (no negative marking on this section):
                </label>
                <input
                  type="text"
                  value={answers[cid]?.given ?? ""}
                  onChange={(e) => setGiven(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full max-w-xs rounded-lg border bg-card px-3 py-2 text-base focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleMark}>
              <Bookmark className="h-4 w-4" />
              {answers[cid]?.status === "marked" ? "Unmark" : "Mark for review"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setGiven(null)}>
              <Eraser className="h-4 w-4" />
              Clear
            </Button>
            <Button size="sm" onClick={goNext} className="ml-auto">
              Save &amp; Next
            </Button>
          </div>
        </Card>
      </div>

      {/* ---------------- Sidebar ---------------- */}
      <aside className="w-full shrink-0 lg:w-72">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold">Progress</span>
            <span className="text-muted">
              {counts.answered} answered · {counts.marked} marked
            </span>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {sections.map((s, i) => {
              if ((bySection.get(s.key)?.length ?? 0) === 0) return null;
              const locked = sectionLocked(i);
              const isActive = effectiveSection === s.key;
              return (
                <button
                  key={s.key}
                  disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    setViewSection(s.key);
                    const first = bySection.get(s.key)?.[0];
                    if (first) selectQuestion(first.id);
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition",
                    isActive
                      ? "bg-primary text-primary-fg"
                      : locked
                        ? "cursor-not-allowed bg-background text-muted/50"
                        : "bg-background hover:bg-border"
                  )}
                >
                  {locked && <Lock className="h-3 w-3" />}
                  {s.short}
                </button>
              );
            })}
          </div>

          {data.mode === "FULL" && config.sectionalTiming && (
            <p className="mb-3 flex items-start gap-1.5 rounded-md bg-warning/10 p-2 text-xs text-warning">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Sections are locked by a 40-minute timer. You can&apos;t return to a
              finished section.
            </p>
          )}

          <div className="grid grid-cols-6 gap-1.5">
            {viewQuestions.map((q, i) => {
              const st = answers[q.id]?.status ?? "unseen";
              const isCurrent = q.id === cid;
              const tone =
                st === "answered"
                  ? "bg-success text-white"
                  : st === "marked"
                    ? "bg-warning text-white"
                    : st === "seen"
                      ? "bg-danger/80 text-white"
                      : "bg-background text-foreground";
              return (
                <button
                  key={q.id}
                  onClick={() => selectQuestion(q.id)}
                  className={cn(
                    "h-8 rounded-md text-xs font-medium transition",
                    tone,
                    isCurrent && "ring-2 ring-primary ring-offset-1"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-success" /> Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-danger/80" /> Not answered
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-warning" /> Marked
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded border bg-background" /> Not visited
            </span>
          </div>

          <Button
            className="mt-4 w-full"
            variant="danger"
            onClick={() => setConfirmOpen(true)}
          >
            <Send className="h-4 w-4" />
            Submit exam
          </Button>
        </Card>
      </aside>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-semibold">Submit the exam?</h3>
            <p className="mt-2 text-sm text-muted">
              {counts.answered} answered
              {counts.marked > 0 && `, ${counts.marked} marked for review`}
              {" "}out of {data.questions.length} questions.{" "}
              {data.questions.length - counts.answered - counts.marked > 0 && (
                <span className="text-danger">
                  {data.questions.length - counts.answered - counts.marked} unattempted.{" "}
                </span>
              )}
              Once submitted, you&apos;ll see your score and full solution review.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Keep going
              </Button>
              <Button variant="danger" onClick={submit}>
                Submit now
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
