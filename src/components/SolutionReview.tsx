"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, MinusCircle, Clock, Star } from "lucide-react";
import { SECTION_LABELS } from "@/lib/examConfig";
import type { SectionKey } from "@/lib/examConfig";
import { cn } from "@/lib/utils";

export interface ReviewAnswer {
  id: string;
  section: string;
  given: string | null;
  isCorrect: boolean | null;
  marks: number | null;
  timeSpentSec: number | null;
  bookmarked: boolean;
  question: {
    stem: string;
    passage: string | null;
    options: string | null;
    answer: string;
    explanation: string | null;
    topic: string;
  };
}

export default function SolutionReview({ answers }: { answers: ReviewAnswer[] }) {
  const [showBookmarked, setShowBookmarked] = useState(false);
  const bookmarkedCount = answers.filter((a) => a.bookmarked).length;
  const filtered = showBookmarked ? answers.filter((a) => a.bookmarked) : answers;
  const indexById = new Map(answers.map((a, i) => [a.id, i]));

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">Solution review</h3>
        {bookmarkedCount > 0 && (
          <button
            onClick={() => setShowBookmarked((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
              showBookmarked
                ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-600"
                : "border-transparent bg-background text-muted hover:text-foreground"
            )}
          >
            <Star className={cn("h-3.5 w-3.5", showBookmarked ? "fill-yellow-400 text-yellow-400" : "")} />
            {showBookmarked ? `Showing ${bookmarkedCount} bookmarked` : `${bookmarkedCount} bookmarked`}
          </button>
        )}
      </div>

      {filtered.length === 0 && showBookmarked && (
        <p className="py-4 text-center text-sm text-muted">No bookmarked questions in this attempt.</p>
      )}

      <div className="space-y-4">
        {filtered.map((a) => {
          const correct = a.isCorrect;
          const Icon =
            correct === true ? CheckCircle2 : correct === false ? XCircle : MinusCircle;
          const tone =
            correct === true ? "text-success" : correct === false ? "text-danger" : "text-muted";
          const originalIndex = indexById.get(a.id) ?? 0;

          return (
            <div key={a.id} className="border-b pb-4 last:border-0">
              <div className="flex items-start gap-2">
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone)} />
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>Q{originalIndex + 1}</span>
                    <span>·</span>
                    <span>{SECTION_LABELS[a.section as SectionKey]}</span>
                    <span>·</span>
                    <span>{a.question.topic}</span>
                    {(a.timeSpentSec ?? 0) > 0 && (
                      <>
                        <span>·</span>
                        <span
                          className={cn(
                            "flex items-center gap-0.5",
                            (a.timeSpentSec ?? 0) > 120 ? "text-warning" : ""
                          )}
                        >
                          <Clock className="h-3 w-3" />
                          {a.timeSpentSec}s
                        </span>
                      </>
                    )}
                    {a.bookmarked && (
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    )}
                    <span className="ml-auto tabular-nums">
                      {a.marks != null && a.marks !== 0
                        ? `${a.marks > 0 ? "+" : ""}${a.marks}`
                        : "0"}{" "}
                      marks
                    </span>
                  </div>
                  {a.question.passage && (
                    <details className="mb-2 text-xs text-muted">
                      <summary className="cursor-pointer">Show passage</summary>
                      <p className="mt-1 whitespace-pre-line">{a.question.passage}</p>
                    </details>
                  )}
                  <p className="whitespace-pre-line text-sm font-medium">{a.question.stem}</p>
                  <div className="mt-2 grid gap-1 text-sm">
                    <div>
                      <span className="text-muted">Your answer: </span>
                      <span
                        className={
                          correct === true
                            ? "text-success"
                            : correct === false
                              ? "text-danger"
                              : "text-muted"
                        }
                      >
                        {a.given && a.given.trim() !== "" ? a.given : "— not attempted —"}
                      </span>
                    </div>
                    {correct !== true && (
                      <div>
                        <span className="text-muted">Correct answer: </span>
                        <span className="font-medium text-success">
                          {(() => {
                            try {
                              const parsed = JSON.parse(a.question.answer);
                              if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
                            } catch {}
                            return a.question.answer;
                          })()}
                        </span>
                      </div>
                    )}
                    {a.question.explanation && (
                      <p className="mt-1 rounded-md bg-background p-2 text-xs text-foreground/80">
                        {a.question.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
