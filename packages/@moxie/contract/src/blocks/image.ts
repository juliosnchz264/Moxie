import { z } from "zod";
import type { BlockDefinition } from "../definition";

const v1Schema = z
  .object({
    src: z.union([z.literal(""), z.string().url()]).default(""),
    alt: z.string().default(""),
    caption: z.string().optional(),
    fit: z.enum(["cover", "contain", "fill"]).default("cover"),
  })
  .passthrough();

export const imageBlock: BlockDefinition = {
  type: "image",
  versions: [{ version: 1, schema: v1Schema }],
};
