import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { FORMULA_SHEETS } from "@/lib/formulas";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Formula Sheet — IPMAT Prep",
};

const SUBJECT_LABELS: Record<string, string> = {
  QUANT: "Quantitative Ability",
  VERBAL: "Verbal Ability",
  LR: "Logical Reasoning",
};

const SUBJECT_ORDER = ["QUANT", "VERBAL", "LR"] as const;

export default function FormulasPage() {
  const bySubject = SUBJECT_ORDER.map((subj) => ({
    subject: subj,
    label: SUBJECT_LABELS[subj],
    sheets: FORMULA_SHEETS.filter((s) => s.subject === subj),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <span className="text-muted">/</span>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Formula Sheet</h1>
          </div>
        </div>
        <p className="text-sm text-muted">
          Topic-wise key formulas &amp; rules for IPMAT
        </p>
      </div>

      {bySubject.map(({ subject, label, sheets }) => (
        <section key={subject}>
          <h2
            className={cn(
              "mb-4 text-sm font-semibold uppercase tracking-widest",
              subject === "QUANT"
                ? "text-primary"
                : subject === "VERBAL"
                  ? "text-success"
                  : "text-warning"
            )}
          >
            {label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sheets.map((sheet) => (
              <details
                key={sheet.topic}
                className="group rounded-xl border bg-card"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-medium hover:bg-background rounded-xl">
                  <span>{sheet.topic}</span>
                  <svg
                    className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="space-y-2 px-4 pb-4 pt-1">
                  {sheet.entries.map((entry, i) => (
                    <div key={i} className="rounded-lg bg-background p-2.5">
                      <div className="text-xs font-semibold text-foreground/90">
                        {entry.label}
                      </div>
                      {entry.formula && (
                        <div className="mt-0.5 font-mono text-xs text-primary">
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
              </details>
            ))}
          </div>
        </section>
      ))}

      <Card className="text-center text-sm text-muted py-4">
        Weak on a topic after a mock? The results page shows these formulas
        automatically for topics below 40% accuracy.
      </Card>
    </div>
  );
}
