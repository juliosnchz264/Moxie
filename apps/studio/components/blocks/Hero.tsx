"use client";

import type { Block } from "@moxie/core";
import { useEditor } from "@/lib/store";
import { InlineText } from "@/components/editor/InlineText";

interface HeroProps {
  title?: string;
  subtitle?: string;
  [key: string]: unknown;
}

export function Hero({ block, className }: { block: Block; className: string }) {
  const editing = useEditor((s) => s.editingId === block.id);
  const update = useEditor((s) => s.updateBlockProps);
  const props = (block.props ?? {}) as HeroProps;

  const setField = (key: "title" | "subtitle") => (value: string) => {
    update(block.id, { ...props, [key]: value });
  };

  return (
    <section className={className}>
      <InlineText
        as="h1"
        className="text-4xl font-bold"
        value={props.title ?? ""}
        placeholder="Click to edit title…"
        editing={editing}
        autoFocus
        onChange={setField("title")}
      />
      <InlineText
        as="p"
        className="mt-2"
        value={props.subtitle ?? ""}
        placeholder="Add a subtitle…"
        editing={editing}
        onChange={setField("subtitle")}
      />
    </section>
  );
}
