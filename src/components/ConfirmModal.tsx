"use client";
import React from "react";
import { Card, Button } from "@/components/ui";

interface Props {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTone = "primary",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-sm space-y-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="text-sm text-muted">{body}</div>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={confirmTone} className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </Card>
    </div>
  );
}
