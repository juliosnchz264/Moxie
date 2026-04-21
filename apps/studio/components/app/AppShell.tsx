"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";

export function AppShell({
  children,
  breadcrumbs,
  right,
}: {
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  right?: ReactNode;
}) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="flex items-center justify-between bg-white border-b px-5 h-12 text-sm sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/sites" className="flex items-center gap-2 shrink-0">
            <Logo className="h-5 w-5 text-slate-900" />
            <span className="font-semibold">Moxie</span>
          </Link>
          {breadcrumbs?.length ? (
            <>
              <span className="text-slate-300">/</span>
              <nav className="flex items-center gap-1 min-w-0 text-slate-500">
                {breadcrumbs.map((b, i) => {
                  const last = i === breadcrumbs.length - 1;
                  return (
                    <span key={i} className="flex items-center gap-1 min-w-0">
                      {b.href && !last ? (
                        <Link
                          href={b.href}
                          className="hover:text-slate-900 truncate"
                        >
                          {b.label}
                        </Link>
                      ) : (
                        <span
                          className={`truncate ${last ? "text-slate-900 font-medium" : ""}`}
                        >
                          {b.label}
                        </span>
                      )}
                      {last ? null : (
                        <span className="text-slate-300">/</span>
                      )}
                    </span>
                  );
                })}
              </nav>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center hover:bg-slate-300"
              title={user?.email ?? ""}
              aria-label="Account menu"
            >
              {user ? user.email.slice(0, 1).toUpperCase() : "?"}
            </button>
            {menuOpen ? (
              <div className="absolute right-0 mt-1 w-56 bg-white border rounded-lg shadow-lg py-1 text-sm">
                <div className="px-3 py-2 border-b">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Signed in as
                  </div>
                  <div className="truncate">{user?.email ?? ""}</div>
                </div>
                <Link
                  href="/sites"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 hover:bg-slate-50"
                >
                  All sites
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-red-600"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
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
