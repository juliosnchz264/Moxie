import type { Block, Page } from "@moxie/core";
import type { BlockRegistry } from "./registry";
import { defaultRegistry } from "./default-registry";
import { migrateProps } from "./migrate";
import { pageSchema } from "./page-schema";

export function validateBlock(
  block: Block,
  registry: BlockRegistry = defaultRegistry,
): Block {
  const def = registry.get(block.type);
  if (!def) {
    throw new Error(`Unknown block type: "${block.type}"`);
  }
  const latest = def.versions[def.versions.length - 1]!;

  const migrated = migrateProps(def, block.version, block.props);
  const validProps = latest.schema.parse(migrated);

  const children = block.children?.map((c) => validateBlock(c, registry));

  return {
    ...block,
    version: latest.version,
    props: validProps,
    ...(children ? { children } : {}),
  };
}

export function validatePage(
  page: Page,
  registry: BlockRegistry = defaultRegistry,
): Page {
  const parsed = pageSchema.parse(page);
  const blocks = parsed.blocks.map((b) =>
    validateBlock(b as Block, registry),
  );
  return { ...parsed, blocks };
}
