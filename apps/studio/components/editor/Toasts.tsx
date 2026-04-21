"use client";

import { useToasts, type ToastKind } from "@/lib/use-toast";

const kindStyle: Record<ToastKind, string> = {
  success: "bg-emerald-600 text-white border-emerald-700",
  error: "bg-red-600 text-white border-red-700",
  info: "bg-slate-900 text-white border-slate-900",
};

const kindIcon: Record<ToastKind, string> = {
  success: "✓",
  error: "⚠",
  info: "ℹ",
};

export function Toasts() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`moxie-toast-in flex items-center gap-2 rounded-md border px-3 py-2 text-xs shadow-lg ${kindStyle[t.kind]}`}
          role="status"
        >
          <span className="text-sm">{kindIcon[t.kind]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
