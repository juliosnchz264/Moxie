"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { primeAuth, useAuth } from "@/lib/use-auth";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/sites";
  const { status } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authed") router.replace(next);
  }, [status, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "register") {
        await api.register(email, password);
      }
      const res = await api.login(email, password);
      if (!res.user) throw new Error("Login failed");
      primeAuth(res.user);
      router.replace(next);
    } catch (err) {
      const msg = (err as Error).message;
      setError(prettifyError(msg, mode));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-7 w-7" />
          Moxie
        </Link>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight">
            Build sites that ship in minutes.
          </h1>
          <p className="text-slate-300 max-w-md">
            Multi-tenant visual CMS with versioned blocks, design tokens, and
            cache-invalidating publish — no rebuilds.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          © {new Date().getFullYear()} Moxie. Free tier ready.
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 font-semibold mb-8">
            <Logo className="h-6 w-6 text-slate-900" />
            Moxie
          </div>
          <h2 className="text-2xl font-semibold mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {mode === "login"
              ? "Sign in to keep building."
              : "Start your first site in under a minute."}
          </p>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-600 font-medium">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 px-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-600 font-medium">
                Password
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 px-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </label>
            {error ? (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="h-10 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {busy
                ? "Working…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
          <div className="mt-6 text-sm text-slate-500 text-center">
            {mode === "login" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="2" y="2" width="28" height="28" rx="7" fill="currentColor" />
      <path
        d="M10 22V10l6 8 6-8v12"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function prettifyError(raw: string, mode: "login" | "register"): string {
  if (/401/.test(raw) || /invalid/i.test(raw)) {
    return mode === "login"
      ? "Wrong email or password."
      : "Could not create account. Try a different email.";
  }
  if (/already/i.test(raw)) return "Email already registered.";
  return raw.replace(/^API \d+:\s*/, "") || "Something went wrong.";
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
          Loading…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
