"use client";

import { useEffect } from "react";
import { resetAllHints } from "@/lib/onboarding";
import { showToast } from "@/lib/use-toast";

interface Shortcut {
  keys: string[];
  label: string;
}

const GROUPS: { title: string; items: Shortcut[] }[] = [
  {
    title: "Editing",
    items: [
      { keys: ["Double-click"], label: "Edit block inline" },
      { keys: ["Esc"], label: "Stop editing / deselect" },
      { keys: ["Cmd/Ctrl", "Z"], label: "Undo" },
      { keys: ["Cmd/Ctrl", "Shift", "Z"], label: "Redo" },
      { keys: ["Cmd/Ctrl", "Y"], label: "Redo (alt)" },
    ],
  },
  {
    title: "Canvas",
    items: [
      { keys: ["Click palette"], label: "Append block" },
      { keys: ["Drag palette → canvas"], label: "Insert at drop slot" },
      { keys: ["Drag ⠿ handle"], label: "Reorder block" },
      { keys: ["Shift/Ctrl", "click"], label: "Multi-select blocks" },
      { keys: ["Cmd/Ctrl", "G"], label: "Group selected into Section" },
      { keys: ["Cmd/Ctrl", "Shift", "G"], label: "Ungroup selected container" },
    ],
  },
  {
    title: "Help",
    items: [
      { keys: ["Cmd/Ctrl", "K"], label: "Command palette" },
      { keys: ["?"], label: "Open this panel" },
    ],
  },
];

export function ShortcutsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">Keyboard shortcuts</h2>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
          {GROUPS.map((g) => (
            <div key={g.title} className="flex flex-col gap-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {g.title}
              </div>
              <ul className="flex flex-col gap-1">
                {g.items.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-700">{s.label}</span>
                    <span className="flex gap-1">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-mono"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <footer className="px-4 py-2 border-t flex items-center justify-between text-[11px] text-slate-500">
          <button
            type="button"
            className="underline hover:text-slate-700"
            onClick={() => {
              resetAllHints();
              showToast("info", "Onboarding reset. Refresh to replay.");
              onClose();
            }}
          >
            Replay tips
          </button>
          <span>
            Press <kbd className="px-1 rounded bg-slate-100">?</kbd> any time
          </span>
        </footer>
      </div>
    </div>
  );
}
