"use client";

import type { Block } from "@moxie/core";
import { useEditor } from "@/lib/store";
import { InlineText } from "@/components/editor/InlineText";

interface CtaProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  [key: string]: unknown;
}

export function Cta({ block, className }: { block: Block; className: string }) {
  const editing = useEditor((s) => s.editingId === block.id);
  const update = useEditor((s) => s.updateBlockProps);
  const props = (block.props ?? {}) as CtaProps;

  const setField =
    (key: "title" | "subtitle" | "ctaLabel") => (value: string) => {
      update(block.id, { ...props, [key]: value });
    };

  return (
    <section className={className}>
      <div className="flex flex-col items-center gap-3">
        <InlineText
          as="h2"
          className="text-3xl font-bold text-center"
          value={props.title ?? ""}
          placeholder="Your headline…"
          editing={editing}
          autoFocus
          onChange={setField("title")}
        />
        <InlineText
          as="p"
          className="text-center max-w-xl"
          value={props.subtitle ?? ""}
          placeholder="Supporting copy (optional)"
          editing={editing}
          onChange={setField("subtitle")}
        />
        <span className="inline-flex items-center rounded bg-blue-600 text-white px-5 py-2.5 text-sm font-medium mt-2">
          <InlineText
            as="span"
            value={props.ctaLabel ?? ""}
            placeholder="Call to action"
            editing={editing}
            onChange={setField("ctaLabel")}
          />
        </span>
      </div>
    </section>
  );
}
