import { z } from "zod";

export const pageStatusSchema = z.enum(["draft", "published"]);

type BlockIn = {
  id: string;
  type: string;
  version: number;
  props?: unknown;
  children?: BlockIn[];
};

export const blockBaseSchema: z.ZodType<BlockIn> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.string(),
    version: z.number().int().positive(),
    props: z.unknown(),
    children: z.array(blockBaseSchema).optional(),
  }),
);

export const pageSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  slug: z.string(),
  title: z.string(),
  blocks: z.array(blockBaseSchema),
  status: pageStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
  description: z.string().optional(),
  metaImage: z.string().optional(),
});
