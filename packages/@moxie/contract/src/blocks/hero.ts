import { z } from "zod";
import type { BlockDefinition } from "../definition";

const v1Schema = z
  .object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
  })
  .passthrough();

export const heroBlock: BlockDefinition = {
  type: "hero",
  versions: [{ version: 1, schema: v1Schema }],
};
