"use client";

import { useState } from "react";
import { Check, Loader2, Pencil } from "lucide-react";

interface Props {
  attemptId: string;
  initialNotes: string;
}

export default function AttemptNotes({ attemptId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (value: string) => {
    setSaving(true);
    await fetch(`/api/attempts/${attemptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: value }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm font-medium">
          <Pencil className="h-3.5 w-3.5" /> Notes
        </label>
        {saving && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </span>
        )}
        {saved && !saving && (
          <span className="flex items-center gap-1 text-xs text-success">
            <Check className="h-3 w-3" /> Saved
          </span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        onBlur={(e) => save(e.target.value)}
        placeholder="How did this attempt go? e.g. 'Rushed QA-SA, need more Number Theory practice'"
        rows={3}
        className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}
