import type { BlockDefinition } from "./definition";

export interface BlockRegistry {
  register(def: BlockDefinition): void;
  get(type: string): BlockDefinition | undefined;
  types(): string[];
}

export function createRegistry(): BlockRegistry {
  const store = new Map<string, BlockDefinition>();

  return {
    register(def) {
      if (def.versions.length === 0) {
        throw new Error(`Block "${def.type}": at least one version required`);
      }
      def.versions.forEach((v, i) => {
        if (v.version !== i + 1) {
          throw new Error(
            `Block "${def.type}": versions must be contiguous starting at 1, got [${def.versions.map((x) => x.version).join(", ")}]`,
          );
        }
        if (i > 0 && !v.migrate) {
          throw new Error(`Block "${def.type}" v${v.version}: missing migrate function`);
        }
      });
      store.set(def.type, def);
    },
    get(type) {
      return store.get(type);
    },
    types() {
      return [...store.keys()];
    },
  };
}
