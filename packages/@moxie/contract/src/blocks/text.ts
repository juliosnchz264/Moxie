import { z } from "zod";
import type { BlockDefinition } from "../definition";

const alignValue = z.enum(["left", "center", "right"]);
const alignResponsive = z.union([
  alignValue,
  z
    .object({
      base: alignValue.optional(),
      md: alignValue.optional(),
      lg: alignValue.optional(),
    })
    .passthrough(),
]);

const v1Schema = z
  .object({
    body: z.string(),
  })
  .passthrough();

const v2Schema = z
  .object({
    body: z.string(),
    align: alignResponsive.default("left"),
  })
  .passthrough();

export const textBlock: BlockDefinition = {
  type: "text",
  versions: [
    { version: 1, schema: v1Schema },
    {
      version: 2,
      schema: v2Schema,
      migrate: (prev) => {
        const parsed = v1Schema.parse(prev);
        return { ...parsed, align: "left" as const };
      },
    },
  ],
};
