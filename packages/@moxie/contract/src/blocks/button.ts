import { z } from "zod";
import type { BlockDefinition } from "../definition";

const v1Schema = z
  .object({
    label: z.string().min(1),
    href: z.string().default("#"),
    variant: z.enum(["primary", "secondary", "ghost"]).default("primary"),
    target: z.enum(["_self", "_blank"]).default("_self"),
  })
  .passthrough();

export const buttonBlock: BlockDefinition = {
  type: "button",
  versions: [{ version: 1, schema: v1Schema }],
};
