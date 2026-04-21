"use client";

import { useEffect } from "react";
import { useEditor } from "./store";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function useEditorShortcuts(
  onOpenHelp?: () => void,
  onOpenPalette?: () => void,
) {
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const selectBlock = useEditor((s) => s.selectBlock);
  const stopEditing = useEditor((s) => s.stopEditing);
  const groupSelectedAs = useEditor((s) => s.groupSelectedAs);
  const ungroupBlock = useEditor((s) => s.ungroupBlock);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = isTypingTarget(e.target);
      const mod = e.metaKey || e.ctrlKey;

      if (mod) {
        const key = e.key.toLowerCase();
        if (key === "k") {
          e.preventDefault();
          onOpenPalette?.();
          return;
        }
        if (typing) return;
        if (key === "z" || key === "y") {
          e.preventDefault();
          if (key === "y" || (key === "z" && e.shiftKey)) redo();
          else undo();
          return;
        }
        if (key === "g") {
          e.preventDefault();
          const state = useEditor.getState();
          if (e.shiftKey) {
            if (state.selectedId) ungroupBlock(state.selectedId);
          } else if (state.selectedIds.length >= 2) {
            groupSelectedAs("section");
          }
          return;
        }
        return;
      }

      if (e.key === "?" && !typing) {
        e.preventDefault();
        onOpenHelp?.();
        return;
      }

      if (e.key === "Escape" && !typing) {
        stopEditing();
        selectBlock(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    undo,
    redo,
    selectBlock,
    stopEditing,
    onOpenHelp,
    onOpenPalette,
    groupSelectedAs,
    ungroupBlock,
  ]);
}
