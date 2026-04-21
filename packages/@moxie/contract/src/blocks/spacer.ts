import { z } from "zod";
import type { BlockDefinition } from "../definition";

const v1Schema = z
  .object({
    size: z.enum(["xs", "sm", "md", "lg", "xl", "2xl"]).default("md"),
  })
  .passthrough();

export const spacerBlock: BlockDefinition = {
  type: "spacer",
  versions: [{ version: 1, schema: v1Schema }],
};
