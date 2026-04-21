"use client";

import type { Block } from "@moxie/core";
import type { ReactNode } from "react";

interface ColumnsProps {
  count?: 2 | 3 | 4;
  [key: string]: unknown;
}

const gridClass: Record<2 | 3 | 4, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function Columns({
  block,
  className,
  slots: inputSlots,
}: {
  block: Block;
  className: string;
  slots?: ReactNode[];
}) {
  const props = (block.props ?? {}) as ColumnsProps;
  const count: 2 | 3 | 4 = props.count ?? 2;
  const slots = Array.from({ length: count }, (_, i) => inputSlots?.[i] ?? null);

  return (
    <div className={`${className} grid ${gridClass[count]} gap-4`.trim()}>
      {slots.map((slot, i) => (
        <div
          key={i}
          className="min-h-16 border border-dashed border-slate-200 rounded p-2"
        >
          {slot ?? (
            <div className="text-xs text-slate-400 italic text-center py-4">
              Drop here
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
