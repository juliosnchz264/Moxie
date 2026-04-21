"use client";

import { useRef, useState, type ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import { resolveBlock } from "@moxie/engine";
import { componentRegistry } from "@/components/blocks/registry";
import { useEditor } from "@/lib/store";
import { useInView, useMeasuredHeight } from "@/lib/canvas-viewport";
import { warningFor } from "@/lib/block-constraints";
import { useHint } from "@/lib/onboarding";
import { InlineControls } from "./InlineControls";

const LEAVE_MS = 180;

export function BlockItem({
  id,
  fresh = false,
  isFirst = false,
}: {
  id: string;
  fresh?: boolean;
  isFirst?: boolean;
}) {
  const block = useEditor((s) => s.page?.blocks.find((b) => b.id === id));
  const allBlocks = useEditor((s) => s.page?.blocks ?? []);
  const selected = useEditor((s) => s.selectedId === id);
  const multiSelected = useEditor(
    (s) => s.selectedIds.includes(id) && s.selectedId !== id,
  );
  const editing = useEditor((s) => s.editingId === id);
  const activeBp = useEditor((s) => s.activeBreakpoint);
  const selectBlock = useEditor((s) => s.selectBlock);
  const toggleSelect = useEditor((s) => s.toggleSelect);
  const startEditing = useEditor((s) => s.startEditing);
  const stopEditing = useEditor((s) => s.stopEditing);
  const removeBlock = useEditor((s) => s.removeBlock);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    isDragging,
  } = useDraggable({
    id,
    data: { kind: "block", blockId: id },
  });

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentMeasureRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(wrapperRef);
  const measuredHeight = useMeasuredHeight(contentMeasureRef);
  const [leaving, setLeaving] = useState(false);
  const editHint = useHint("double-click-edit");
  const showEditHint = isFirst && !editHint.dismissed && !editing && !selected;

  if (!block) return null;

  const handleDelete = () => {
    if (!confirm(`Delete ${block.type} block?`)) return;
    const el = wrapperRef.current;
    if (el) {
      el.style.setProperty("--moxie-leave-h", `${el.getBoundingClientRect().height}px`);
    }
    setLeaving(true);
    setTimeout(() => removeBlock(id), LEAVE_MS);
  };

  let content: ReactNode;
  try {
    const resolved = resolveBlock<ReactNode>(block, {
      components: componentRegistry,
      activeBp,
    });
    content = resolved.component({
      block: resolved.block,
      className: resolved.className,
    });
  } catch (e) {
    content = (
      <div className="text-red-600 text-sm p-4">
        Invalid block: {(e as Error).message}
      </div>
    );
  }

  const ring = editing
    ? "ring-2 ring-emerald-500"
    : selected
      ? "ring-2 ring-blue-500"
      : multiSelected
        ? "ring-2 ring-blue-300"
        : "ring-1 ring-transparent hover:ring-slate-300";

  // Keep the wrapper always mounted so DnD + selection still work.
  // When off-screen (not editing/selected) swap heavy content for a
  // placeholder at the last measured height to preserve scroll geometry.
  const shouldRenderContent = inView || editing || selected || isDragging;

  const setWrapperRefs = (node: HTMLDivElement | null) => {
    wrapperRef.current = node;
    setNodeRef(node);
  };

  const animClass = leaving
    ? "moxie-block-leave"
    : fresh
      ? "moxie-block-enter"
      : "";

  return (
    <div
      ref={setWrapperRefs}
      className={`group relative mx-3 my-1 rounded-md transition-[box-shadow,transform] duration-150 ease-out ${ring} ${
        isDragging ? "opacity-30" : ""
      } ${animClass} ${selected || editing ? "" : "hover:shadow-sm"}`}
      onClick={(e) => {
        e.stopPropagation();
        if (editing) return;
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          toggleSelect(id);
        } else {
          selectBlock(id);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        editHint.dismiss();
        startEditing(id);
      }}
    >
      <div
        className={`absolute -top-3 right-2 flex gap-1 z-10 transition-opacity ${
          selected || editing
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {editing ? (
          <button
            className="px-2 py-1 rounded bg-emerald-600 text-white border border-emerald-700 text-xs shadow-sm hover:bg-emerald-700"
            onClick={(e) => {
              e.stopPropagation();
              stopEditing();
            }}
            title="Done editing"
          >
            Done
          </button>
        ) : (
          <>
            <button
              className="px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                startEditing(id);
              }}
              title="Edit inline"
            >
              ✎
            </button>
            <button
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className="px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-700 shadow-sm hover:bg-slate-50 cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              title="Drag to reorder"
            >
              ⠿
            </button>
            <button
              className="px-2 py-1 rounded bg-white border border-slate-200 text-xs text-red-600 shadow-sm hover:bg-red-50 transition-colors duration-150"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              title="Delete block"
            >
              ✕
            </button>
          </>
        )}
      </div>
      <div className="pointer-events-none absolute -top-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <span className="px-1.5 bg-white rounded text-[10px] uppercase tracking-wide text-slate-400">
          {block.type} v{block.version}
          {editing ? " · editing" : null}
        </span>
        {warningFor(block, allBlocks) ? (
          <span
            className="px-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800"
            title={warningFor(block, allBlocks)!.message}
          >
            ⚠
          </span>
        ) : null}
      </div>
      {showEditHint ? (
        <div className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] shadow-md flex items-center gap-1">
          <span>💡</span>
          <span>Double-click to edit</span>
        </div>
      ) : null}
      {selected && !editing ? <InlineControls block={block} /> : null}
      {shouldRenderContent ? (
        <div ref={contentMeasureRef}>{content}</div>
      ) : (
        <div
          aria-hidden
          style={{ height: measuredHeight ?? 120 }}
          className="bg-slate-50/40"
        />
      )}
    </div>
  );
}
