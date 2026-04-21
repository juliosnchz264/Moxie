/// <reference path="../.astro/types.d.ts" />

import type { SiteDoc } from './lib/api';

declare global {
  namespace App {
    interface Locals {
      siteId?: string;
      site?: SiteDoc;
    }
  }

  interface ImportMetaEnv {
    readonly PAYLOAD_API_URL?: string;
  }
}

export {};
