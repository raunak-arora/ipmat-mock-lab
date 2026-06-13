"use client";

import { useState } from "react";
import { BarChart2, BookOpen, Users } from "lucide-react";
import QuestionAdmin from "@/components/QuestionAdmin";
import AdminPerformance from "@/components/AdminPerformance";
import StudentManager from "@/components/StudentManager";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "performance", label: "Performance", icon: BarChart2 },
  { key: "questions", label: "Question Bank", icon: BookOpen },
  { key: "students", label: "Students", icon: Users },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("performance");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-1 text-sm text-muted">
          Track performance, manage the question bank, or control student access.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border bg-card p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "performance" && <AdminPerformance />}
      {tab === "questions" && <QuestionAdmin />}
      {tab === "students" && <StudentManager />}
    </div>
  );
}
