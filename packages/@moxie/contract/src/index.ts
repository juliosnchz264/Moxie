export type { BlockDefinition, BlockVersionDef } from "./definition";
export type { BlockRegistry } from "./registry";

export { createRegistry } from "./registry";
export { defaultRegistry } from "./default-registry";
export { validateBlock, validatePage } from "./validate";
export { migrateProps } from "./migrate";
export { blockBaseSchema, pageSchema, pageStatusSchema } from "./page-schema";
export { heroBlock, textBlock } from "./blocks";
