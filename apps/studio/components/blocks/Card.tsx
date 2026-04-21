"use client";

import type { Block } from "@moxie/core";
import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  [key: string]: unknown;
}

export function Card({
  block,
  className,
  slots,
}: {
  block: Block;
  className: string;
  slots?: ReactNode[];
}) {
  const props = (block.props ?? {}) as CardProps;
  const empty = !slots || slots.length === 0;

  return (
    <article
      className={`${className} bg-white border border-slate-200 shadow-sm rounded-lg`.trim()}
    >
      {props.title ? (
        <header className="font-semibold mb-2">{props.title}</header>
      ) : null}
      {empty ? (
        <div className="text-xs text-slate-400 italic border border-dashed border-slate-200 rounded p-3 text-center">
          Empty card — drop blocks inside
        </div>
      ) : (
        <div className="flex flex-col">
          {slots.map((node, i) => (
            <div key={i}>{node}</div>
          ))}
        </div>
      )}
    </article>
  );
}
