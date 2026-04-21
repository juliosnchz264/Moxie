"use client";

import { useHint } from "@/lib/onboarding";

const STEPS: { icon: string; title: string; body: string }[] = [
  {
    icon: "🧱",
    title: "Drag or click blocks",
    body: "The left palette is your block library. Click to append, drag into the canvas to drop precisely.",
  },
  {
    icon: "✏️",
    title: "Double-click to edit",
    body: "Text, buttons, and rich text edit in place. Esc or click outside commits.",
  },
  {
    icon: "🎛️",
    title: "Inline controls when selected",
    body: "Align, padding, and width pop up on the block itself. Per-device — use the top-bar device switcher.",
  },
  {
    icon: "💾",
    title: "Autosaves + Publish",
    body: "Every edit saves silently after 1.5s. Hit Publish to purge the CDN cache — no rebuild required.",
  },
];

export function WelcomeModal() {
  const hint = useHint("welcome-tour");
  if (hint.dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col overflow-hidden">
        <header className="px-5 py-4 border-b">
          <h2 className="font-semibold text-base">Welcome to Moxie ✨</h2>
          <p className="text-xs text-slate-500 mt-1">
            Four things to know before you start.
          </p>
        </header>
        <ul className="flex flex-col gap-3 px-5 py-4">
          {STEPS.map((s) => (
            <li key={s.title} className="flex gap-3">
              <div className="text-xl leading-none pt-0.5">{s.icon}</div>
              <div>
                <div className="text-sm font-medium text-slate-800">
                  {s.title}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{s.body}</div>
              </div>
            </li>
          ))}
        </ul>
        <footer className="px-5 py-3 border-t flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Press <kbd className="px-1 rounded bg-slate-100">?</kbd> any time
            for shortcuts.
          </span>
          <button
            type="button"
            className="px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800"
            onClick={hint.dismiss}
          >
            Got it
          </button>
        </footer>
      </div>
    </div>
  );
}
