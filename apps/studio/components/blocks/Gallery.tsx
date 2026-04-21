"use client";

import type { Block } from "@moxie/core";

interface GalleryItem {
  src: string;
  alt?: string;
}

interface GalleryProps {
  columns?: 2 | 3 | 4;
  items?: GalleryItem[];
  [key: string]: unknown;
}

const colsClass: Record<2 | 3 | 4, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function Gallery({
  block,
  className,
}: {
  block: Block;
  className: string;
}) {
  const props = (block.props ?? {}) as GalleryProps;
  const cols: 2 | 3 | 4 = props.columns ?? 3;
  const items = props.items ?? [];

  if (items.length === 0) {
    return (
      <div className={`${className} text-xs text-slate-400 italic border border-dashed border-slate-200 rounded p-6 text-center`.trim()}>
        Empty gallery — add images in the props panel
      </div>
    );
  }

  return (
    <div className={`${className} grid ${colsClass[cols]} gap-2`.trim()}>
      {items.map((item, i) => (
        <img
          key={i}
          src={item.src}
          alt={item.alt ?? ""}
          className="w-full aspect-square object-cover rounded"
          loading="lazy"
        />
      ))}
    </div>
  );
}
