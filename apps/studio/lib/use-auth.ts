"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { api, type PayloadUser } from "./api-client";

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "authed"; user: PayloadUser }
  | { status: "anon"; user: null };

let cached: AuthState = { status: "loading", user: null };
const listeners = new Set<() => void>();

function publish(next: AuthState) {
  cached = next;
  for (const l of listeners) l();
}

async function refresh(): Promise<AuthState> {
  try {
    const res = await api.me();
    if (res.user) {
      const next: AuthState = { status: "authed", user: res.user };
      publish(next);
      return next;
    }
  } catch {
    // fall through
  }
  const next: AuthState = { status: "anon", user: null };
  publish(next);
  return next;
}

let inFlight: Promise<AuthState> | null = null;
function ensureRefresh(): Promise<AuthState> {
  if (!inFlight) {
    inFlight = refresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

function subscribe(onStore: () => void) {
  listeners.add(onStore);
  return () => {
    listeners.delete(onStore);
  };
}

function getSnapshot() {
  return cached;
}

export function useAuth(): AuthState & {
  refresh: () => Promise<AuthState>;
  signOut: () => Promise<void>;
} {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (cached.status === "loading") void ensureRefresh();
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    publish({ status: "anon", user: null });
  }, []);

  return { ...state, refresh: ensureRefresh, signOut };
}

export function primeAuth(user: PayloadUser) {
  publish({ status: "authed", user });
}
