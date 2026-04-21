import { z } from "zod";
import type { BlockDefinition } from "../definition";

const v1Schema = z
  .object({
    count: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
  })
  .passthrough();

export const columnsBlock: BlockDefinition = {
  type: "columns",
  versions: [{ version: 1, schema: v1Schema }],
};
