"use client";

import { useCallback, useState } from "react";

const PREFIX = "moxie:onboarding:";

export type HintId =
  | "double-click-edit"
  | "drag-from-palette"
  | "templates-available"
  | "welcome-tour"
  | "inline-controls-tip";

function readDismissed(id: HintId): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(PREFIX + id) === "1";
  } catch {
    return true;
  }
}

function writeDismissed(id: HintId): void {
  try {
    window.localStorage.setItem(PREFIX + id, "1");
  } catch {
    // storage unavailable; still suppress in-session
  }
}

export function useHint(id: HintId): {
  dismissed: boolean;
  dismiss: () => void;
} {
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed(id));

  const dismiss = useCallback(() => {
    writeDismissed(id);
    setDismissed(true);
  }, [id]);

  return { dismissed, dismiss };
}

export function resetAllHints(): void {
  if (typeof window === "undefined") return;
  const ids: HintId[] = [
    "double-click-edit",
    "drag-from-palette",
    "templates-available",
    "welcome-tour",
    "inline-controls-tip",
  ];
  try {
    for (const id of ids) window.localStorage.removeItem(PREFIX + id);
  } catch {
    // ignore
  }
}
