"use client";

import type { Block } from "@moxie/core";
import { useEditor } from "@/lib/store";
import { InlineText } from "@/components/editor/InlineText";

interface TextProps {
  body?: string;
  [key: string]: unknown;
}

export function Text({ block, className }: { block: Block; className: string }) {
  const editing = useEditor((s) => s.editingId === block.id);
  const update = useEditor((s) => s.updateBlockProps);
  const props = (block.props ?? {}) as TextProps;

  return (
    <InlineText
      as="div"
      className={className}
      value={props.body ?? ""}
      placeholder="Click to edit…"
      editing={editing}
      autoFocus
      multiline
      onChange={(v) => update(block.id, { ...props, body: v })}
    />
  );
}
