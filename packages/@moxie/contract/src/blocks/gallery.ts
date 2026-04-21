import { z } from "zod";
import type { BlockDefinition } from "../definition";

const imageItem = z.object({
  src: z.union([z.literal(""), z.string().url()]).default(""),
  alt: z.string().default(""),
});

const v1Schema = z
  .object({
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
    items: z.array(imageItem).default([]),
  })
  .passthrough();

export const galleryBlock: BlockDefinition = {
  type: "gallery",
  versions: [{ version: 1, schema: v1Schema }],
};
