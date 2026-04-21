"use client";

import { useEffect, useRef } from "react";
import type { Block } from "@moxie/core";
import { EditorContent, useEditor as useTipTap } from "@tiptap/react";
import { useEditor } from "@/lib/store";
import { richTextExtensions } from "@/lib/richtext-extensions";
import { renderRichTextToHtml } from "@/lib/richtext-html";
import { RichTextToolbar } from "@/components/editor/RichTextToolbar";

interface RichTextProps {
  content?: unknown;
  [key: string]: unknown;
}

const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };

export function RichText({
  block,
  className,
}: {
  block: Block;
  className: string;
}) {
  const editing = useEditor((s) => s.editingId === block.id);
  const update = useEditor((s) => s.updateBlockProps);
  const props = (block.props ?? {}) as RichTextProps;
  const content = props.content ?? emptyDoc;
  const lastCommittedRef = useRef(content);

  const tiptap = useTipTap({
    extensions: richTextExtensions,
    content: content,
    editable: editing,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "outline-none min-h-[1.5em]",
      },
    },
  });

  useEffect(() => {
    if (!tiptap) return;
    tiptap.setEditable(editing);
    if (editing) tiptap.commands.focus("end");
  }, [editing, tiptap]);

  useEffect(() => {
    if (!tiptap) return;
    if (editing) return;
    const current = tiptap.getJSON();
    if (JSON.stringify(current) === JSON.stringify(lastCommittedRef.current)) return;
    lastCommittedRef.current = current;
    const page = useEditor.getState().page;
    const latest = page?.blocks.find((b) => b.id === block.id);
    const latestProps = (latest?.props ?? {}) as RichTextProps;
    update(block.id, { ...latestProps, content: current });
  }, [editing, tiptap, block.id, update]);

  if (!editing) {
    return (
      <div
        className={`${className} space-y-2`.trim()}
        dangerouslySetInnerHTML={{
          __html:
            renderRichTextToHtml(content) ||
            '<p class="text-slate-400 italic">Click to edit…</p>',
        }}
      />
    );
  }

  return (
    <div
      className={`${className} space-y-2 relative`.trim()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="absolute -top-10 left-0 z-10">
        <RichTextToolbar editor={tiptap} />
      </div>
      <EditorContent editor={tiptap} />
    </div>
  );
}
