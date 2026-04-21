"use client";

import { use, useEffect, useState } from "react";
import type { Page } from "@moxie/core";
import { Editor } from "@/components/editor/Editor";
import { AuthGuard } from "@/components/app/AuthGuard";
import { adaptPayloadPage, api } from "@/lib/api-client";
import { useEditor } from "@/lib/store";

function EditorInner({ pageId }: { pageId: string }) {
  const setSite = useEditor((s) => s.setSite);
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getPage(pageId)
      .then(async (doc) => {
        if (cancelled) return;
        const adapted = adaptPayloadPage(doc);
        setPage(adapted);
        try {
          const site = await api.getSite(adapted.siteId);
          if (!cancelled) setSite(site);
        } catch {
          // site fetch optional — editor still works with defaultTheme
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [pageId, setSite]);

  if (error) {
    return (
      <div className="p-8 text-red-600">Failed to load page: {error}</div>
    );
  }
  if (!page) {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }
  return <Editor initialPage={page} />;
}

export default function EditorRoute({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = use(params);
  return (
    <AuthGuard>
      <EditorInner pageId={pageId} />
    </AuthGuard>
  );
}
