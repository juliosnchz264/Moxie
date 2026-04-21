"use client";

import type { Block } from "@moxie/core";
import type { ReactNode } from "react";

interface SectionProps {
  label?: string;
  [key: string]: unknown;
}

export function Section({
  block,
  className,
  slots,
}: {
  block: Block;
  className: string;
  slots?: ReactNode[];
}) {
  const props = (block.props ?? {}) as SectionProps;
  const empty = !slots || slots.length === 0;

  return (
    <section className={`${className} relative`.trim()}>
      {props.label ? (
        <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">
          {props.label}
        </div>
      ) : null}
      {empty ? (
        <div className="text-xs text-slate-400 italic border border-dashed border-slate-300 rounded p-4 text-center">
          Empty section — drop blocks inside
        </div>
      ) : (
        <div className="flex flex-col">
          {slots.map((node, i) => (
            <div key={i}>{node}</div>
          ))}
        </div>
      )}
    </section>
  );
}
