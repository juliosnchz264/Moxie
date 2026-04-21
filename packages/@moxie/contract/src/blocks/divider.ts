import { z } from "zod";
import type { BlockDefinition } from "../definition";

const v1Schema = z
  .object({
    style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
    thickness: z.enum(["thin", "medium", "thick"]).default("thin"),
  })
  .passthrough();

export const dividerBlock: BlockDefinition = {
  type: "divider",
  versions: [{ version: 1, schema: v1Schema }],
};
