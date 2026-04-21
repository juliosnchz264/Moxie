"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor } from "@/lib/store";
import { api, type PayloadPageDoc } from "@/lib/api-client";
import {
  pageStatusLabel,
  statusColor,
  formatRelativeTime,
} from "@/lib/page-status";

type EditingKind = "page" | "header" | "footer";

export function PagesSidebar({
  siteId,
  currentPageId,
  editing,
}: {
  siteId: string | null;
  currentPageId?: string | null;
  editing: EditingKind;
}) {
  const router = useRouter();
  const site = useEditor((s) => s.site);
  const [pages, setPages] = useState<PayloadPageDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    if (!siteId) return;
    try {
      const res = await api.listPages(siteId);
      setPages(res.docs);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!siteId) return;
    api
      .listPages(siteId)
      .then((res) => {
        if (!cancelled) setPages(res.docs);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  const create = async () => {
    if (!siteId || busy) return;
    const title = window.prompt("Page title");
    if (!title) return;
    const slug = window
      .prompt("Slug", slugify(title))
      ?.trim();
    if (!slug) return;
    setBusy(true);
    try {
      const doc = await api.createPage({ title, slug, site: siteId });
      await reload();
      router.push(`/editor/${doc.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const doc = await api.duplicatePage(id);
      await reload();
      router.push(`/editor/${doc.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, title: string) => {
    if (busy) return;
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.deletePage(id);
      const remaining = (pages ?? []).filter((p) => p.id !== id);
      setPages(remaining);
      if (currentPageId === id) {
        const fallback = remaining[0];
        if (fallback) router.push(`/editor/${fallback.id}`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const goto = (id: string) => router.push(`/editor/${id}`);
  const gotoSlot = (slot: "header" | "footer") => {
    if (!siteId) return;
    router.push(`/editor/site/${siteId}/${slot}`);
  };

  return (
    <aside className="w-60 border-r bg-white flex flex-col text-sm">
      <header className="px-3 py-2 border-b">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">
          Site
        </div>
        <div className="font-semibold truncate">{site?.name ?? "—"}</div>
      </header>

      <div className="px-3 py-2 border-b">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
          Shared
        </div>
        <button
          type="button"
          onClick={() => gotoSlot("header")}
          className={`w-full text-left px-2 py-1 rounded text-xs ${
            editing === "header"
              ? "bg-indigo-50 text-indigo-700 font-medium"
              : "hover:bg-slate-50"
          }`}
        >
          Header
        </button>
        <button
          type="button"
          onClick={() => gotoSlot("footer")}
          className={`w-full text-left px-2 py-1 rounded text-xs ${
            editing === "footer"
              ? "bg-indigo-50 text-indigo-700 font-medium"
              : "hover:bg-slate-50"
          }`}
        >
          Footer
        </button>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">
          Pages
        </div>
        <button
          type="button"
          onClick={create}
          disabled={!siteId || busy}
          className="text-xs px-2 py-0.5 rounded border hover:bg-slate-50 disabled:opacity-50"
          title="New page"
        >
          + New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pages === null ? (
          <ul aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="px-3 py-2 border-b border-slate-50 animate-pulse"
              >
                <div className="h-3 w-32 bg-slate-200 rounded mb-1.5" />
                <div className="h-2 w-20 bg-slate-100 rounded" />
              </li>
            ))}
          </ul>
        ) : pages.length === 0 ? (
          <div className="p-3 text-xs text-slate-400">No pages yet</div>
        ) : (
          <ul>
            {pages.map((p) => {
              const isCurrent = editing === "page" && p.id === currentPageId;
              return (
                <li
                  key={p.id}
                  className={`group flex items-center gap-1 px-3 py-1.5 border-b border-slate-50 ${
                    isCurrent ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => goto(p.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div
                      className={`truncate ${
                        isCurrent ? "font-semibold text-blue-700" : ""
                      }`}
                    >
                      {p.title}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
                      <span className="truncate">/{p.slug}</span>
                      <span
                        className={`shrink-0 px-1 py-0 rounded-sm ${statusColor(
                          pageStatusLabel(p),
                        )}`}
                      >
                        {pageStatusLabel(p)}
                      </span>
                    </div>
                    {p.status === "published" ? (
                      <div
                        className="text-[10px] text-slate-400 truncate"
                        title={
                          p.lastVisitedAt
                            ? `Last visit: ${new Date(p.lastVisitedAt).toLocaleString()}`
                            : "No visits yet"
                        }
                      >
                        {(p.views ?? 0).toLocaleString()} view
                        {(p.views ?? 0) === 1 ? "" : "s"}
                        {p.lastVisitedAt
                          ? ` · ${formatRelativeTime(p.lastVisitedAt)}`
                          : ""}
                      </div>
                    ) : null}
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => duplicate(p.id)}
                      disabled={busy}
                      className="text-[10px] px-1 py-0.5 rounded hover:bg-slate-200 disabled:opacity-50"
                      title="Duplicate"
                    >
                      ⎘
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p.id, p.title)}
                      disabled={busy}
                      className="text-[10px] px-1 py-0.5 rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error ? (
        <div className="p-2 text-[11px] text-red-600 border-t bg-red-50">
          {error}
        </div>
      ) : null}
    </aside>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
