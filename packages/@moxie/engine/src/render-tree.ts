import type { Block } from "@moxie/core";
import { resolveBlock, type ResolveOptions } from "./resolve";

export function renderTree<T>(blocks: Block[], opts: ResolveOptions<T>): T[] {
  return blocks.map((b) => renderBlock(b, opts));
}

function renderBlock<T>(block: Block, opts: ResolveOptions<T>): T {
  const { block: validated, component, className } = resolveBlock(block, opts);
  const children = validated.children
    ? validated.children.map((c) => renderBlock(c, opts))
    : undefined;
  return component({ block: validated, children, className });
}
