import type { Block } from "@moxie/core";

type TokenKey =
  | "padding"
  | "paddingX"
  | "paddingY"
  | "gap"
  | "bg"
  | "color"
  | "radius"
  | "fontSize"
  | "align"
  | "shadow"
  | "border"
  | "borderColor"
  | "maxWidth";

export interface BlockConstraint {
  allow?: readonly TokenKey[];
  options?: Partial<Record<TokenKey, readonly string[]>>;
}

const LAYOUT = ["padding", "paddingX", "paddingY", "gap", "align", "maxWidth"] as const;
const APPEARANCE = ["bg", "color", "radius", "fontSize", "shadow", "border", "borderColor"] as const;
const ALL = [...LAYOUT, ...APPEARANCE] as const;

export const BLOCK_CONSTRAINTS: Record<string, BlockConstraint> = {
  hero: {
    allow: ["padding", "paddingY", "bg", "color", "align", "maxWidth"],
    options: { maxWidth: ["none", "prose", "lg", "xl", "2xl", "full"] },
  },
  text: {
    allow: ["padding", "paddingY", "color", "align", "fontSize", "maxWidth"],
    options: { maxWidth: ["none", "prose", "lg", "xl", "full"] },
  },
  richtext: {
    allow: ["padding", "paddingY", "color", "align", "fontSize", "maxWidth"],
    options: { maxWidth: ["none", "prose", "lg", "xl", "full"] },
  },
  section: { allow: ALL },
  columns: {
    allow: ["padding", "paddingX", "paddingY", "gap", "bg", "maxWidth"],
  },
  image: {
    allow: ["padding", "radius", "shadow", "border", "borderColor", "maxWidth"],
  },
  button: {
    allow: ["padding", "align"],
  },
  spacer: { allow: [] },
  divider: { allow: ["paddingY", "color", "maxWidth"] },
  card: {
    allow: ["padding", "gap", "bg", "radius", "shadow", "border", "borderColor", "maxWidth"],
  },
  cta: {
    allow: ["padding", "paddingY", "bg", "color", "align", "radius", "maxWidth"],
  },
  gallery: {
    allow: ["padding", "gap", "radius", "maxWidth"],
  },
};

export function allowedTokens(type: string): readonly TokenKey[] {
  const c = BLOCK_CONSTRAINTS[type];
  if (!c) return ALL;
  return c.allow ?? ALL;
}

export function tokenOptions(
  type: string,
  key: TokenKey,
  full: readonly string[],
): readonly string[] {
  const c = BLOCK_CONSTRAINTS[type];
  const override = c?.options?.[key];
  if (!override) return full;
  return full.filter((o) => override.includes(o));
}

export interface BlockWarning {
  level: "warn";
  message: string;
}

export function validateNesting(
  block: Block,
  parents: readonly Block[],
): BlockWarning | null {
  if (block.type === "columns" && parents.some((p) => p.type === "columns")) {
    return {
      level: "warn",
      message: "Nested columns inside columns — layout may collapse on mobile.",
    };
  }
  if (block.type === "section" && parents.some((p) => p.type === "section")) {
    return { level: "warn", message: "Sections inside sections add no value." };
  }
  return null;
}

export function warningFor(
  block: Block,
  allBlocks: Block[],
): BlockWarning | null {
  const parents = findParents(block.id, allBlocks);
  return validateNesting(block, parents);
}

function findParents(id: string, blocks: Block[], trail: Block[] = []): Block[] {
  for (const b of blocks) {
    if (b.id === id) return trail;
    if (b.children?.length) {
      const hit = findParents(id, b.children, [...trail, b]);
      if (hit.length > 0 || b.children.some((c) => c.id === id)) {
        return [...trail, b];
      }
    }
  }
  return trail;
}
