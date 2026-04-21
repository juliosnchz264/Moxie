import { z } from "zod";
import type { BlockDefinition } from "../definition";

const v1Schema = z
  .object({
    title: z.string().optional(),
  })
  .passthrough();

export const cardBlock: BlockDefinition = {
  type: "card",
  versions: [{ version: 1, schema: v1Schema }],
};
