import type { Block } from "@moxie/core";

export interface BlockComponentArgs<T> {
  block: Block;
  children?: T[];
  className: string;
}

export type BlockComponent<T> = (args: BlockComponentArgs<T>) => T;

export interface ComponentRegistry<T> {
  register(type: string, fn: BlockComponent<T>): void;
  get(type: string): BlockComponent<T> | undefined;
  types(): string[];
}

export function createComponentRegistry<T>(): ComponentRegistry<T> {
  const m = new Map<string, BlockComponent<T>>();
  return {
    register(type, fn) {
      if (m.has(type)) {
        throw new Error(`Component for block type "${type}" already registered`);
      }
      m.set(type, fn);
    },
    get(type) {
      return m.get(type);
    },
    types() {
      return Array.from(m.keys());
    },
  };
}
