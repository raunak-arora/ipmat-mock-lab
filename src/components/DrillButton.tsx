"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui";

interface Props {
  exam: string;
  profileId: string;
  weakTopics: string[];
}

export default function DrillButton({ exam, profileId, weakTopics }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, exam, mode: "TOPIC", scopeTopics: weakTopics }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not start drill.");
        setLoading(false);
        return;
      }
      const { attemptId } = await res.json();
      router.push(`/mock/${attemptId}`);
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={start} disabled={loading} variant="outline" size="sm">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Dumbbell className="h-4 w-4" />
        )}
        {loading ? "Starting…" : `Drill weak topics (${weakTopics.length})`}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
