import { z } from "zod";
import type { BlockDefinition } from "../definition";

const richTextNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z
    .object({
      type: z.string(),
      content: z.array(richTextNodeSchema).optional(),
      text: z.string().optional(),
      marks: z
        .array(
          z
            .object({
              type: z.string(),
              attrs: z.record(z.unknown()).optional(),
            })
            .passthrough(),
        )
        .optional(),
      attrs: z.record(z.unknown()).optional(),
    })
    .passthrough(),
);

const emptyDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const v1Schema = z
  .object({
    content: richTextNodeSchema.default(emptyDoc),
  })
  .passthrough();

export const richtextBlock: BlockDefinition = {
  type: "richtext",
  versions: [{ version: 1, schema: v1Schema }],
};
