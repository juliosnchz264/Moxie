"use client";

import type { Block } from "@moxie/core";

interface SpacerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  [key: string]: unknown;
}

const sizeClass: Record<
  "xs" | "sm" | "md" | "lg" | "xl" | "2xl",
  string
> = {
  xs: "h-2",
  sm: "h-4",
  md: "h-8",
  lg: "h-12",
  xl: "h-16",
  "2xl": "h-24",
};

export function Spacer({
  block,
  className,
}: {
  block: Block;
  className: string;
}) {
  const props = (block.props ?? {}) as SpacerProps;
  const size = props.size ?? "md";
  return (
    <div
      className={`${className} ${sizeClass[size]} relative`.trim()}
      aria-hidden
    >
      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-300 opacity-0 hover:opacity-100 transition-opacity border border-dashed border-slate-200 rounded">
        Spacer · {size}
      </div>
    </div>
  );
}
