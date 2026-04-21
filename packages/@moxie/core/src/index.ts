export type ContractVersion = number;

export interface Block {
  id: string;
  type: string;
  version: ContractVersion;
  props: unknown;
  children?: Block[];
}

export type PageStatus = "draft" | "published";

export interface Page {
  id: string;
  siteId: string;
  slug: string;
  title: string;
  blocks: Block[];
  status: PageStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  description?: string;
  metaImage?: string;
}
