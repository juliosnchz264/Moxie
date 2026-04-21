"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";

export default function Home() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authed") router.replace("/sites");
    else if (status === "anon") router.replace("/login");
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 text-slate-500">
        <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
        Loading…
      </div>
    </div>
  );
}
