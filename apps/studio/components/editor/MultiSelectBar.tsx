"use client";

import { useEditor } from "@/lib/store";

export function MultiSelectBar() {
  const selectedIds = useEditor((s) => s.selectedIds);
  const groupSelectedAs = useEditor((s) => s.groupSelectedAs);
  const clearSelection = useEditor((s) => s.clearSelection);
  const removeBlock = useEditor((s) => s.removeBlock);

  if (selectedIds.length < 2) return null;

  const count = selectedIds.length;

  const deleteAll = () => {
    if (!confirm(`Delete ${count} blocks?`)) return;
    for (const id of [...selectedIds]) removeBlock(id);
  };

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-slate-900 text-white rounded-lg shadow-xl px-2 py-1.5"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="px-2 text-xs text-slate-300">{count} selected</span>
      <div className="w-px h-5 bg-slate-700" />
      <button
        type="button"
        className="px-2.5 py-1 rounded text-xs hover:bg-slate-800"
        onClick={() => groupSelectedAs("section")}
        title="Wrap in a Section (Cmd/Ctrl+G)"
      >
        ▢ Group
      </button>
      <button
        type="button"
        className="px-2.5 py-1 rounded text-xs hover:bg-slate-800"
        onClick={() => groupSelectedAs("columns")}
        title="Wrap in Columns"
      >
        ▦ Columns
      </button>
      <div className="w-px h-5 bg-slate-700" />
      <button
        type="button"
        className="px-2.5 py-1 rounded text-xs text-red-300 hover:bg-red-600 hover:text-white transition-colors"
        onClick={deleteAll}
        title="Delete all selected"
      >
        ✕ Delete
      </button>
      <button
        type="button"
        className="px-2.5 py-1 rounded text-xs text-slate-300 hover:bg-slate-800"
        onClick={clearSelection}
        title="Clear selection (Esc)"
      >
        Clear
      </button>
    </div>
  );
}
