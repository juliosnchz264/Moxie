import type { Block } from "@moxie/core";
import { validateBlock, defaultRegistry, type BlockRegistry } from "@moxie/contract";
import { resolveTokens, type Breakpoint, type TokenProps } from "@moxie/tokens";
import type { BlockComponent, ComponentRegistry } from "./component-registry";

export interface ResolveOptions<T> {
  contract?: BlockRegistry;
  components: ComponentRegistry<T>;
  activeBp?: Breakpoint;
}

export interface ResolvedBlock<T> {
  block: Block;
  component: BlockComponent<T>;
  className: string;
}

export function resolveBlock<T>(
  block: Block,
  opts: ResolveOptions<T>,
): ResolvedBlock<T> {
  const contract = opts.contract ?? defaultRegistry;
  const validated = validateBlock(block, contract);
  const component = opts.components.get(validated.type);
  if (!component) {
    throw new Error(
      `No component registered for block type "${validated.type}"`,
    );
  }
  const tokenProps = (validated.props ?? {}) as TokenProps;
  const className = resolveTokens(tokenProps, { activeBp: opts.activeBp });
  return { block: validated, component, className };
}
