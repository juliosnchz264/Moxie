"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEditor } from "@/lib/store";
import { WEB_URL } from "@/lib/api-client";
import { publishCurrentPage } from "@/lib/publish-page";
import { DeviceSwitch } from "./DeviceSwitch";
import { pageStatusLabel, statusColor } from "@/lib/page-status";

function publicUrlFor(domain: string, slug: string): string {
  try {
    const web = new URL(WEB_URL);
    const host = domain.split(":")[0];
    web.hostname = host || web.hostname;
    web.pathname = slug && slug !== "home" ? `/${slug}` : "/";
    return web.toString();
  } catch {
    return `${WEB_URL}${slug && slug !== "home" ? `/${slug}` : "/"}`;
  }
}

function SaveIndicator() {
  const status = useEditor((s) => s.saveStatus);
  const dirty = useEditor((s) => s.dirty);
  const error = useEditor((s) => s.saveError);
  const lastSavedAt = useEditor((s) => s.lastSavedAt);
  const [relative, setRelative] = useState<string>("");
  const [savingVisible, setSavingVisible] = useState(false);

  useEffect(() => {
    if (!lastSavedAt) return;
    const tick = () => {
      const seconds = Math.floor((Date.now() - lastSavedAt) / 1000);
      if (seconds < 5) setRelative("just now");
      else if (seconds < 60) setRelative(`${seconds}s ago`);
      else setRelative(`${Math.floor(seconds / 60)}m ago`);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  useEffect(() => {
    if (status !== "saving") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset latch between save cycles
      setSavingVisible(false);
      return;
    }
    const t = setTimeout(() => setSavingVisible(true), 300);
    return () => clearTimeout(t);
  }, [status]);

  if (status === "saving" && savingVisible) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="text-xs text-red-600 max-w-xs truncate" title={error ?? ""}>
        ⚠ Save failed
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Unsaved changes
      </span>
    );
  }
  if (status === "saved" && lastSavedAt) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600">
        <span
          key={lastSavedAt}
          className="moxie-save-pulse h-1.5 w-1.5 rounded-full bg-emerald-500"
        />
        Saved {relative}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-400">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      Idle
    </span>
  );
}

export function Toolbar({
  onTogglePreview,
  previewing,
  designMode,
  onToggleDesignMode,
  onOpenTemplates,
  onOpenHelp,
}: {
  onTogglePreview: () => void;
  previewing: boolean;
  designMode: boolean;
  onToggleDesignMode: () => void;
  onOpenTemplates?: () => void;
  onOpenHelp?: () => void;
}) {
  const page = useEditor((s) => s.page);
  const site = useEditor((s) => s.site);
  const mode = useEditor((s) => s.mode);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const publish = async () => {
    setPublishing(true);
    setPublishError(null);
    const res = await publishCurrentPage();
    if (!res.ok) setPublishError(res.error ?? null);
    setPublishing(false);
  };

  const isSiteSlot = mode === "header" || mode === "footer";
  const liveUrl =
    site && page && mode === "page"
      ? publicUrlFor(site.domain, page.slug)
      : site
        ? publicUrlFor(site.domain, "")
        : null;

  return (
    <header className="flex items-center justify-between border-b bg-white px-4 py-2 text-sm">
      <div className="flex items-center gap-3 min-w-0">
        {site ? (
          <Link
            href={`/sites/${site.id}`}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 shrink-0"
            title="Back to site dashboard"
          >
            <span aria-hidden>←</span>
            <span className="truncate max-w-32">{site.name}</span>
            <span className="text-slate-300">/</span>
          </Link>
        ) : (
          <Link
            href="/sites"
            className="text-slate-500 hover:text-slate-900 shrink-0"
          >
            ← Sites
          </Link>
        )}
        <div className="font-semibold truncate">{page?.title ?? "—"}</div>
        {page ? (
          isSiteSlot ? (
            <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase tracking-wider">
              {mode}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <span>/{page.slug}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor(
                  pageStatusLabel({
                    status: page.status,
                    publishedAt: page.publishedAt,
                    updatedAt: page.updatedAt,
                  }),
                )}`}
              >
                {pageStatusLabel({
                  status: page.status,
                  publishedAt: page.publishedAt,
                  updatedAt: page.updatedAt,
                })}
              </span>
            </span>
          )
        ) : null}
        <div className="ml-3">
          <SaveIndicator />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DeviceSwitch />
        <div className="flex items-center gap-0.5 mr-1">
          <button
            className="px-2 py-1 rounded border text-xs hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
            disabled={!canUndo}
            onClick={undo}
            title="Undo (Cmd/Ctrl+Z)"
          >
            ↶
          </button>
          <button
            className="px-2 py-1 rounded border text-xs hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
            disabled={!canRedo}
            onClick={redo}
            title="Redo (Cmd/Ctrl+Shift+Z)"
          >
            ↷
          </button>
        </div>
        {publishError ? (
          <span className="text-xs text-red-600 max-w-xs truncate">
            {publishError}
          </span>
        ) : null}
        {isSiteSlot || !onOpenTemplates ? null : (
          <button
            className="px-3 py-1 border rounded hover:bg-slate-50"
            onClick={onOpenTemplates}
            title="Start from a page template"
          >
            Templates
          </button>
        )}
        {onOpenHelp ? (
          <button
            className="h-7 w-7 flex items-center justify-center border rounded hover:bg-slate-50 text-slate-500"
            onClick={onOpenHelp}
            title="Keyboard shortcuts (press ?)"
            aria-label="Help"
          >
            ?
          </button>
        ) : null}
        <button
          className={`px-3 py-1 border rounded ${
            designMode
              ? "bg-slate-900 text-white border-slate-900"
              : "hover:bg-slate-50"
          }`}
          onClick={onToggleDesignMode}
          title="Design System"
        >
          Theme
        </button>
        {isSiteSlot ? null : (
          <button
            className="px-3 py-1 border rounded hover:bg-slate-50"
            onClick={onTogglePreview}
          >
            {previewing ? "Edit" : "Preview"}
          </button>
        )}
        {liveUrl && !isSiteSlot ? (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 border rounded hover:bg-slate-50 flex items-center gap-1"
            title="Open live site"
          >
            Live <span aria-hidden>↗</span>
          </a>
        ) : null}
        {isSiteSlot ? null : (
          <button
            className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
            disabled={!page || publishing}
            onClick={publish}
          >
            Publish
          </button>
        )}
      </div>
    </header>
  );
}
