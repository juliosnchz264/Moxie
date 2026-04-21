import type { Block } from "@moxie/core";

type Props = Record<string, unknown>;
type Patch = Record<string, unknown>;

const AUTO_KEY = "_auto";

export interface LayoutContext {
  index: number;
  siblings: Block[];
  parent?: Block;
  prev?: Block;
  next?: Block;
  isFirst: boolean;
  isLast: boolean;
}

function readAlign(b?: Block): string | undefined {
  if (!b) return undefined;
  const a = (b.props as Props | undefined)?.align;
  if (typeof a === "string") return a;
  if (a && typeof a === "object") {
    const o = a as Record<string, unknown>;
    const v = o.base ?? o.md ?? o.lg;
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

export function computeLayoutContext(block: Block, ctx: LayoutContext): Patch {
  const patch: Patch = {};
  const { prev, next, parent, isFirst } = ctx;

  switch (block.type) {
    case "text":
    case "richtext":
      if (prev?.type === "hero") {
        patch.paddingY = "lg";
        patch.maxWidth = "prose";
        const a = readAlign(prev);
        if (a) patch.align = a;
      }
      break;
    case "button":
      if (prev?.type === "text" || prev?.type === "richtext") {
        patch.align = "center";
        patch.paddingY = "md";
      } else if (prev?.type === "hero") {
        patch.align = readAlign(prev) ?? "center";
      }
      break;
    case "image":
      if (prev && next && prev.type !== "hero" && next.type !== "hero") {
        patch.radius = "md";
        patch.shadow = "sm";
      }
      break;
    case "divider":
      if (prev && next) patch.paddingY = "sm";
      break;
    case "cta":
      if (prev?.type === "hero") patch.bg = "background";
      break;
  }

  if (
    !parent &&
    isFirst &&
    block.type !== "hero" &&
    block.type !== "spacer" &&
    block.type !== "divider" &&
    patch.padding === undefined
  ) {
    patch.padding = "lg";
  }

  return patch;
}

function applyPatchToBlock(block: Block, patch: Patch): Block {
  const rawProps = { ...((block.props ?? {}) as Props) };
  const prevAutoRaw = rawProps[AUTO_KEY];
  const prevAuto: string[] = Array.isArray(prevAutoRaw)
    ? (prevAutoRaw as string[])
    : [];
  const nextAuto: string[] = [];

  for (const [key, value] of Object.entries(patch)) {
    const isAuto = prevAuto.includes(key);
    const current = rawProps[key];
    const isUnset = current === undefined || current === "";
    if (isAuto || isUnset) {
      rawProps[key] = value;
      nextAuto.push(key);
    }
  }

  for (const key of prevAuto) {
    if (!(key in patch)) delete rawProps[key];
  }

  if (nextAuto.length > 0) rawProps[AUTO_KEY] = nextAuto;
  else delete rawProps[AUTO_KEY];

  return { ...block, props: rawProps };
}

export function applyAutoLayout(blocks: Block[], parent?: Block): Block[] {
  return blocks.map((block, index) => {
    const ctx: LayoutContext = {
      index,
      siblings: blocks,
      parent,
      prev: index > 0 ? blocks[index - 1] : undefined,
      next: index < blocks.length - 1 ? blocks[index + 1] : undefined,
      isFirst: index === 0,
      isLast: index === blocks.length - 1,
    };
    const patch = computeLayoutContext(block, ctx);
    const patched = applyPatchToBlock(block, patch);
    if (Array.isArray(block.children) && block.children.length > 0) {
      const newChildren = applyAutoLayout(block.children, patched);
      return { ...patched, children: newChildren };
    }
    return patched;
  });
}

export function reconcileUserEdit(prev: Props, next: Props): Props {
  const prevAutoRaw = prev[AUTO_KEY];
  const prevAuto: string[] = Array.isArray(prevAutoRaw)
    ? (prevAutoRaw as string[])
    : [];
  if (prevAuto.length === 0) return next;

  const out = { ...next };
  const remaining: string[] = [];
  for (const key of prevAuto) {
    const before = prev[key];
    const after = out[key];
    const changed = JSON.stringify(before) !== JSON.stringify(after);
    if (!changed) remaining.push(key);
  }

  if (remaining.length > 0) out[AUTO_KEY] = remaining;
  else delete out[AUTO_KEY];

  return out;
}

export function isAutoKey(block: Block, key: string): boolean {
  const raw = (block.props as Props | undefined)?.[AUTO_KEY];
  return Array.isArray(raw) && raw.includes(key);
}
