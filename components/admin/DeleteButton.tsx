"use client";

import { useState, useTransition } from "react";

export function DeleteButton({ action, label = "حذف", confirmText }: { action: () => Promise<{ error?: string } | void>; label?: string; confirmText: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" disabled={pending} className="btn-danger"
        onClick={() => confirm(confirmText) && start(async () => { const r = await action(); if (r?.error) setError(r.error); })}>
        {pending ? "..." : label}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </span>
  );
}
