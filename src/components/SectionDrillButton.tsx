"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";

interface Props {
  profileId: string;
  exam: string;
  sectionKey: string;
  sectionLabel: string;
}

export default function SectionDrillButton({ profileId, exam, sectionKey, sectionLabel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, exam, mode: "SECTIONAL", scopeSection: sectionKey }),
    });
    if (res.ok) {
      const { attemptId } = await res.json();
      router.push(`/mock/${attemptId}`);
    } else {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={start}
      disabled={loading}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10 disabled:opacity-50 transition"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
      {loading ? "Starting…" : `Retry ${sectionLabel}`}
    </button>
  );
}
