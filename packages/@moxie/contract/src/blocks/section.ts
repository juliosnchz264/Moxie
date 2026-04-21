import { z } from "zod";
import type { BlockDefinition } from "../definition";

const v1Schema = z
  .object({
    label: z.string().optional(),
  })
  .passthrough();

export const sectionBlock: BlockDefinition = {
  type: "section",
  versions: [{ version: 1, schema: v1Schema }],
};
