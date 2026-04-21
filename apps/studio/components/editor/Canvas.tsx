"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useShallow } from "zustand/react/shallow";
import { resolveThemeColors } from "@moxie/tokens";
import { useEditor } from "@/lib/store";
import { CanvasScrollRootContext } from "@/lib/canvas-viewport";
import { findTemplate } from "@/lib/templates";
import { BlockItem } from "./BlockItem";

function useFreshIds(ids: string[]): Set<string> {
  const seenRef = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (seenRef.current === null) {
      seenRef.current = new Set(ids);
      return;
    }
    const seen = seenRef.current;
    const added = ids.filter((id) => !seen.has(id));
    for (const id of ids) seen.add(id);
    for (const id of Array.from(seen)) if (!ids.includes(id)) seen.delete(id);
    if (added.length === 0) return;
    setFresh((prev) => {
      const next = new Set(prev);
      for (const id of added) next.add(id);
      return next;
    });
    const timer = setTimeout(() => {
      setFresh((prev) => {
        const next = new Set(prev);
        for (const id of added) next.delete(id);
        return next;
      });
    }, 220);
    return () => clearTimeout(timer);
  }, [ids]);

  return fresh;
}

function DropSlot({
  index,
  visible,
}: {
  index: number;
  visible: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${index}`,
    data: { kind: "slot", index },
  });

  if (!visible) {
    return <div ref={setNodeRef} className="h-0" aria-hidden />;
  }

  return (
    <div
      ref={setNodeRef}
      className="relative h-3 -my-1.5 flex items-center mx-6"
    >
      <div
        className={`h-0.5 w-full rounded transition-all ${
          isOver
            ? "bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.25)] h-1"
            : "bg-transparent"
        }`}
      />
    </div>
  );
}

const deviceWidth: Record<string, string> = {
  desktop: "1024px",
  tablet: "768px",
  mobile: "390px",
};

function EmptyCanvas({
  mode,
  onBrowseTemplates,
  onQuickAdd,
}: {
  mode: string;
  onBrowseTemplates?: () => void;
  onQuickAdd: (type: string) => void;
}) {
  const isSlot = mode !== "page";
  return (
    <div className="m-6 rounded-lg border-2 border-dashed border-slate-300 bg-white/60 py-14 px-6 text-center">
      <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
        ✨
      </div>
      <div className="text-base font-semibold text-slate-800">
        {isSlot
          ? `Your ${mode} is empty`
          : "Let's build something"}
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {isSlot
          ? "Add blocks that will appear on every page."
          : "Start from a polished template or drop in your first block."}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {!isSlot && onBrowseTemplates ? (
          <button
            className="px-3.5 py-2 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition"
            onClick={(e) => {
              e.stopPropagation();
              onBrowseTemplates();
            }}
          >
            ✨ Start from a template
          </button>
        ) : null}
        <button
          className="px-3.5 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:border-blue-400 hover:bg-blue-50/40 transition"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd("hero");
          }}
        >
          + Add a Hero
        </button>
        <button
          className="px-3.5 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:border-blue-400 hover:bg-blue-50/40 transition"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd("text");
          }}
        >
          + Add Text
        </button>
      </div>
      <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <span>←</span>
        <span>Or drag any block from the left panel</span>
      </div>
    </div>
  );
}

export function Canvas({
  dragActive,
  onBrowseTemplates,
}: {
  dragActive: boolean;
  onBrowseTemplates?: () => void;
}) {
  const blockIds = useEditor(
    useShallow((s) => s.page?.blocks.map((b) => b.id) ?? []),
  );
  const hasPage = useEditor((s) => s.page !== null);
  const mode = useEditor((s) => s.mode);
  const selectBlock = useEditor((s) => s.selectBlock);
  const stopEditing = useEditor((s) => s.stopEditing);
  const addBlock = useEditor((s) => s.addBlock);
  const device = useEditor((s) => s.device);
  const theme = useEditor((s) => s.theme);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const freshIds = useFreshIds(blockIds);

  const themeStyle = useMemo(() => {
    const colors = resolveThemeColors(theme);
    const style: Record<string, string> = {};
    for (const [k, v] of Object.entries(colors)) style[`--color-${k}`] = v;
    if (theme.fonts?.sans) {
      style["--font-sans"] = theme.fonts.sans + ", system-ui, sans-serif";
      style.fontFamily = "var(--font-sans)";
    }
    if (theme.fonts?.heading) {
      style["--font-heading"] =
        theme.fonts.heading + ", system-ui, sans-serif";
    }
    return style;
  }, [theme]);

  if (!hasPage) return null;

  const clearFocus = () => {
    stopEditing();
    selectBlock(null);
  };

  return (
    <CanvasScrollRootContext.Provider value={scrollRootRef}>
      <div
        ref={scrollRootRef}
        className="h-full overflow-auto bg-slate-200 py-8"
        onClick={clearFocus}
      >
        <div
          className="mx-auto shadow-lg rounded min-h-[60vh] transition-[max-width] duration-200"
          style={{
            maxWidth: deviceWidth[device] ?? deviceWidth.desktop,
            background: "var(--color-background)",
            color: "var(--color-foreground)",
            ...themeStyle,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col py-3">
            <DropSlot index={0} visible={dragActive} />
            {blockIds.map((id, i) => (
              <Fragment key={id}>
                <BlockItem
                  id={id}
                  fresh={freshIds.has(id)}
                  isFirst={i === 0}
                />
                <DropSlot index={i + 1} visible={dragActive} />
              </Fragment>
            ))}
            {blockIds.length === 0 ? (
              <EmptyCanvas
                mode={mode}
                onBrowseTemplates={onBrowseTemplates}
                onQuickAdd={(type) => {
                  const tpl = findTemplate(type);
                  if (tpl) addBlock(tpl.build());
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </CanvasScrollRootContext.Provider>
  );
}
