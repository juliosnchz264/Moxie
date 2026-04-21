"use client";

import { useEffect, useState } from "react";

export type ToastKind = "success" | "error" | "info";
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

type Listener = (toasts: Toast[]) => void;

let currentToasts: Toast[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function emit() {
  for (const l of listeners) l(currentToasts);
}

export function showToast(
  kind: ToastKind,
  message: string,
  ttlMs = 2400,
): number {
  const id = nextId++;
  currentToasts = [...currentToasts, { id, kind, message }];
  emit();
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    emit();
  }, ttlMs);
  return id;
}

export function useToasts(): Toast[] {
  const [toasts, setToasts] = useState<Toast[]>(currentToasts);
  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);
  return toasts;
}
