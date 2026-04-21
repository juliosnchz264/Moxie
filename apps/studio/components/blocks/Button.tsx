"use client";

import type { Block } from "@moxie/core";
import { useEditor } from "@/lib/store";
import { InlineText } from "@/components/editor/InlineText";

interface ButtonProps {
  label?: string;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  target?: "_self" | "_blank";
  [key: string]: unknown;
}

const variantClass: Record<"primary" | "secondary" | "ghost", string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300",
  ghost: "bg-transparent text-blue-600 hover:bg-blue-50 border border-blue-600",
};

export function Button({
  block,
  className,
}: {
  block: Block;
  className: string;
}) {
  const editing = useEditor((s) => s.editingId === block.id);
  const update = useEditor((s) => s.updateBlockProps);
  const props = (block.props ?? {}) as ButtonProps;
  const variant = props.variant ?? "primary";

  return (
    <div className={className}>
      <span
        className={`inline-flex items-center rounded px-4 py-2 text-sm font-medium transition ${variantClass[variant]}`}
      >
        <InlineText
          as="span"
          value={props.label ?? ""}
          placeholder="Button label"
          editing={editing}
          autoFocus
          onChange={(v) => update(block.id, { ...props, label: v })}
        />
      </span>
    </div>
  );
}
