import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { FORMULA_SHEETS } from "@/lib/formulas";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Formula Sheet — IPMAT & CAT Prep",
};

const SUBJECT_META = {
  QUANT:    { label: "Quantitative Ability (IPMAT)", color: "text-primary",  bg: "bg-primary/10 text-primary" },
  VERBAL:   { label: "Verbal Ability (IPMAT)",        color: "text-success",  bg: "bg-success/10 text-success" },
  LR:       { label: "Logical Reasoning (IPMAT)",     color: "text-warning",  bg: "bg-warning/10 text-warning" },
  CAT_QA:   { label: "Quantitative Ability (CAT)",    color: "text-primary",  bg: "bg-primary/10 text-primary" },
  CAT_VARC: { label: "Verbal Ability & RC (CAT)",     color: "text-success",  bg: "bg-success/10 text-success" },
  CAT_DILR: { label: "Data Interpretation & LR (CAT)", color: "text-warning", bg: "bg-warning/10 text-warning" },
} as const;

const SUBJECT_ORDER = ["QUANT", "VERBAL", "LR", "CAT_QA", "CAT_VARC", "CAT_DILR"] as const;

export default function FormulasPage() {
  const bySubject = SUBJECT_ORDER.map((subj) => ({
    subject: subj,
    ...SUBJECT_META[subj],
    sheets: FORMULA_SHEETS.filter((s) => s.subject === subj),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Formula Sheet</h1>
        </div>
        <p className="mt-1 text-sm text-muted">
          Key formulas, rules, and patterns — topic-wise for IPMAT &amp; CAT
        </p>
      </div>

      {/* Subject sections */}
      {bySubject.map(({ subject, label, color, bg, sheets }) => (
        <section key={subject} id={subject.toLowerCase()}>
          {/* Subject header */}
          <div className="mb-3 flex items-center gap-3">
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", bg)}>
              {label}
            </span>
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">{sheets.length} topics</span>
          </div>

          {/* Topic accordions — full width, stacked */}
          <div className="divide-y rounded-xl border">
            {sheets.map((sheet, i) => (
              <details
                key={sheet.topic}
                className={cn(
                  "group",
                  i === 0 && "rounded-t-xl",
                  i === sheets.length - 1 && "rounded-b-xl"
                )}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 hover:bg-card select-none">
                  <span className="font-medium text-sm">{sheet.topic}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted hidden sm:block">
                      {sheet.entries.length} entries
                    </span>
                    <svg
                      className={cn("h-4 w-4 shrink-0 transition-transform group-open:rotate-180", color)}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </summary>

                <div className="border-t px-4 pb-4 pt-3 bg-card/50">
                  <div className="space-y-2">
                    {sheet.entries.map((entry, j) => (
                      <div
                        key={j}
                        className="rounded-lg border bg-background px-3 py-2.5"
                      >
                        <div className="text-sm font-medium">{entry.label}</div>
                        {entry.formula && (
                          <div className={cn("mt-1 font-mono text-sm", color)}>
                            {entry.formula}
                          </div>
                        )}
                        {entry.note && (
                          <div className="mt-0.5 text-xs text-muted leading-relaxed">
                            {entry.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <p className="pb-4 text-center text-xs text-muted">
        Weak topics on the results page automatically show their formulas.
      </p>
    </div>
  );
}
