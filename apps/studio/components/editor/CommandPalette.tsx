"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor } from "@/lib/store";
import { api, WEB_URL, type PayloadPageDoc } from "@/lib/api-client";
import { useAuth } from "@/lib/use-auth";
import { buildCommands, type Command, type CommandContext } from "@/lib/commands";
import { rankCommands } from "@/lib/fuzzy";
import { useRecentCommands } from "@/lib/use-recent-commands";

interface Props {
  open: boolean;
  onClose: () => void;
  previewing: boolean;
  designMode: boolean;
  onTogglePreview: () => void;
  onToggleDesign: () => void;
  onOpenTemplates: () => void;
  onOpenHelp: () => void;
  onPublish: () => void | Promise<void>;
}

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

export function CommandPalette(props: Props) {
  const {
    open,
    onClose,
    previewing,
    designMode,
    onTogglePreview,
    onToggleDesign,
    onOpenTemplates,
    onOpenHelp,
    onPublish,
  } = props;

  const router = useRouter();
  const { signOut } = useAuth();

  const page = useEditor((s) => s.page);
  const site = useEditor((s) => s.site);
  const mode = useEditor((s) => s.mode);
  const device = useEditor((s) => s.device);
  const selectedId = useEditor((s) => s.selectedId);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const addBlock = useEditor((s) => s.addBlock);
  const setDevice = useEditor((s) => s.setDevice);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const removeBlock = useEditor((s) => s.removeBlock);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pages, setPages] = useState<PayloadPageDoc[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { ids: recentIds, push: pushRecent } = useRecentCommands();

  useEffect(() => {
    if (!open || !site?.id || pages !== null) return;
    let cancelled = false;
    api
      .listPages(site.id)
      .then((res) => {
        if (!cancelled) setPages(res.docs);
      })
      .catch(() => {
        if (!cancelled) setPages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, site?.id, pages]);

  const ctx: CommandContext = useMemo(
    () => ({
      page: page
        ? {
            id: page.id,
            slug: page.slug,
            title: page.title,
            status: page.status,
          }
        : null,
      site,
      mode,
      device,
      selectedId,
      canUndo,
      canRedo,
      previewing,
      designMode,
      pages,
      addBlock,
      setDevice,
      undo,
      redo,
      removeBlock,
      navigate: (href) => router.push(href),
      openLiveSite: (slug) => {
        if (!site) return;
        window.open(publicUrlFor(site.domain, slug ?? ""), "_blank", "noopener,noreferrer");
      },
      togglePreview: onTogglePreview,
      toggleDesign: onToggleDesign,
      openTemplates: onOpenTemplates,
      openHelp: onOpenHelp,
      publish: onPublish,
      signOut: () => signOut().then(() => router.push("/login")),
    }),
    [
      page,
      site,
      mode,
      device,
      selectedId,
      canUndo,
      canRedo,
      previewing,
      designMode,
      pages,
      addBlock,
      setDevice,
      undo,
      redo,
      removeBlock,
      router,
      onTogglePreview,
      onToggleDesign,
      onOpenTemplates,
      onOpenHelp,
      onPublish,
      signOut,
    ],
  );

  const allCommands = useMemo(() => buildCommands(ctx), [ctx]);
  const byId = useMemo(() => {
    const map = new Map<string, Command>();
    for (const c of allCommands) map.set(c.id, c);
    return map;
  }, [allCommands]);

  const { sections, flat } = useMemo(() => {
    const q = query.trim();
    if (q) {
      const ranked = rankCommands(allCommands, q);
      return {
        sections: [{ label: "Results", items: ranked }],
        flat: ranked,
      };
    }

    const recents: Command[] = [];
    for (const id of recentIds) {
      const c = byId.get(id);
      if (c) recents.push(c);
    }

    const groups = new Map<string, Command[]>();
    for (const c of allCommands) {
      const arr = groups.get(c.group) ?? [];
      arr.push(c);
      groups.set(c.group, arr);
    }
    const order = ["Insert", "Navigate", "Page", "View", "Device", "Account"];
    const sects: { label: string; items: Command[] }[] = [];
    if (recents.length) sects.push({ label: "Recent", items: recents });
    for (const key of order) {
      const items = groups.get(key);
      if (items && items.length) sects.push({ label: key, items });
    }
    const flatList = sects.flatMap((s) => s.items);
    return { sections: sects, flat: flatList };
  }, [allCommands, byId, query, recentIds]);

  const activeIdx = flat.length === 0 ? -1 : Math.min(active, flat.length - 1);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-active="true"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  if (!open) return null;

  const runAt = (idx: number) => {
    const cmd = flat[idx];
    if (!cmd) return;
    onClose();
    pushRecent(cmd.id);
    void cmd.run();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      runAt(activeIdx);
    }
  };

  let cursor = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh] px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <span className="text-slate-400 text-sm">⌘K</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            autoFocus
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Type a command or search…"
            className="flex-1 outline-none text-sm placeholder:text-slate-400"
          />
          {query ? (
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-700"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              clear
            </button>
          ) : null}
        </div>
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto max-h-[56vh] py-1"
        >
          {flat.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No commands match “{query}”
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.label} className="py-1">
                <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.label}
                </div>
                <ul>
                  {section.items.map((cmd) => {
                    const idx = cursor++;
                    const isActive = idx === activeIdx;
                    return (
                      <li key={cmd.id}>
                        <button
                          type="button"
                          data-active={isActive}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm ${
                            isActive
                              ? "bg-slate-900 text-white"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => runAt(idx)}
                        >
                          <span
                            className={`w-5 text-center text-base ${
                              isActive ? "text-white/80" : "text-slate-400"
                            }`}
                            aria-hidden
                          >
                            {cmd.icon ?? "›"}
                          </span>
                          <span className="flex-1 truncate">{cmd.label}</span>
                          {cmd.hint ? (
                            <span
                              className={`text-xs truncate max-w-[40%] ${
                                isActive ? "text-white/70" : "text-slate-400"
                              }`}
                            >
                              {cmd.hint}
                            </span>
                          ) : null}
                          {cmd.shortcut ? (
                            <kbd
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {cmd.shortcut}
                            </kbd>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-2">
            <kbd className="px-1 rounded bg-slate-100 text-slate-500">↑↓</kbd>
            navigate
            <kbd className="px-1 rounded bg-slate-100 text-slate-500">↵</kbd>
            run
            <kbd className="px-1 rounded bg-slate-100 text-slate-500">Esc</kbd>
            close
          </span>
          <span>{flat.length} commands</span>
        </div>
      </div>
    </div>
  );
}
