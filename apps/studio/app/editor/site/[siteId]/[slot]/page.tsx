"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import type { Block, Page } from "@moxie/core";
import { Editor } from "@/components/editor/Editor";
import { AuthGuard } from "@/components/app/AuthGuard";
import { api } from "@/lib/api-client";
import { useEditor, type EditorMode } from "@/lib/store";

const VALID_SLOTS = new Set<EditorMode>(["header", "footer"]);

function SiteSlotInner({
  siteId,
  slot,
}: {
  siteId: string;
  slot: string;
}) {
  const setSite = useEditor((s) => s.setSite);
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!VALID_SLOTS.has(slot as EditorMode)) {
    notFound();
  }
  const mode = slot as Extract<EditorMode, "header" | "footer">;

  useEffect(() => {
    let cancelled = false;
    api
      .getSite(siteId)
      .then((site) => {
        if (cancelled) return;
        setSite(site);
        const blocks = (site[mode] ?? []) as Block[];
        const now = new Date().toISOString();
        const synthetic: Page = {
          id: site.id,
          siteId: site.id,
          slug: mode,
          title: `${site.name} — ${mode}`,
          blocks,
          status: "draft",
          createdAt: site.createdAt ?? now,
          updatedAt: site.updatedAt ?? now,
        };
        setPage(synthetic);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [siteId, mode, setSite]);

  if (error) {
    return (
      <div className="p-8 text-red-600">Failed to load site: {error}</div>
    );
  }
  if (!page) {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }
  return <Editor initialPage={page} initialMode={mode} />;
}

export default function SiteSlotRoute({
  params,
}: {
  params: Promise<{ siteId: string; slot: string }>;
}) {
  const { siteId, slot } = use(params);
  return (
    <AuthGuard>
      <SiteSlotInner siteId={siteId} slot={slot} />
    </AuthGuard>
  );
}
