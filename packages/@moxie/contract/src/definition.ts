import type { z } from "zod";
import type { ContractVersion } from "@moxie/core";

export interface BlockVersionDef {
  version: ContractVersion;
  schema: z.ZodType;
  /**
   * Migrate props from (version - 1) to this version.
   * Required for every version except the first.
   */
  migrate?: (prevProps: unknown) => unknown;
}

export interface BlockDefinition {
  type: string;
  versions: BlockVersionDef[];
}
