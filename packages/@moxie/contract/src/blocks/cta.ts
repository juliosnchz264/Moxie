import { z } from "zod";
import type { BlockDefinition } from "../definition";

const v1Schema = z
  .object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    ctaLabel: z.string().min(1),
    ctaHref: z.string().default("#"),
  })
  .passthrough();

export const ctaBlock: BlockDefinition = {
  type: "cta",
  versions: [{ version: 1, schema: v1Schema }],
};
