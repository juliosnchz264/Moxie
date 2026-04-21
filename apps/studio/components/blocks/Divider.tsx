"use client";

import type { Block } from "@moxie/core";

interface DividerProps {
  style?: "solid" | "dashed" | "dotted";
  thickness?: "thin" | "medium" | "thick";
  [key: string]: unknown;
}

const styleClass: Record<"solid" | "dashed" | "dotted", string> = {
  solid: "border-solid",
  dashed: "border-dashed",
  dotted: "border-dotted",
};

const thicknessClass: Record<"thin" | "medium" | "thick", string> = {
  thin: "border-t",
  medium: "border-t-2",
  thick: "border-t-4",
};

export function Divider({
  block,
  className,
}: {
  block: Block;
  className: string;
}) {
  const props = (block.props ?? {}) as DividerProps;
  const style = props.style ?? "solid";
  const thickness = props.thickness ?? "thin";
  return (
    <div className={className}>
      <hr
        className={`${thicknessClass[thickness]} ${styleClass[style]} border-slate-300`}
      />
    </div>
  );
}
