import type { Block, Page } from "@moxie/core";
import type { Theme } from "@moxie/tokens";

export interface PayloadSiteDoc {
  id: string;
  name: string;
  slug: string;
  domain: string;
  theme?: Theme | null;
  header?: Block[] | null;
  footer?: Block[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayloadUser {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
export const WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:4321";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

function unwrapDoc<T>(res: unknown): T {
  if (
    res &&
    typeof res === "object" &&
    "doc" in res &&
    (res as { doc?: unknown }).doc &&
    typeof (res as { doc?: unknown }).doc === "object"
  ) {
    return (res as { doc: T }).doc;
  }
  return res as T;
}

async function requestDoc<T>(path: string, init?: RequestInit): Promise<T> {
  const raw = await request<unknown>(path, init);
  return unwrapDoc<T>(raw);
}

export interface PayloadPageDoc {
  id: string;
  title: string;
  slug: string;
  site: string | { id: string };
  status: "draft" | "published";
  layout: unknown[];
  description?: string | null;
  metaImage?: string | null;
  publishedAt?: string;
  views?: number | null;
  lastVisitedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function adaptPayloadPage(doc: PayloadPageDoc): Page & {
  description?: string;
  metaImage?: string;
} {
  const siteId = typeof doc.site === "string" ? doc.site : doc.site.id;
  return {
    id: doc.id,
    siteId,
    slug: doc.slug,
    title: doc.title,
    blocks: (doc.layout ?? []) as Page["blocks"],
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    ...(doc.publishedAt ? { publishedAt: doc.publishedAt } : {}),
    ...(doc.description ? { description: doc.description } : {}),
    ...(doc.metaImage ? { metaImage: doc.metaImage } : {}),
  };
}

export interface PayloadMediaSize {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  filename?: string | null;
  mimeType?: string | null;
}

export interface PayloadMediaDoc {
  id: string;
  alt?: string;
  url?: string;
  thumbnailURL?: string;
  filename?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  filesize?: number;
  sizes?: {
    thumbnail?: PayloadMediaSize;
    card?: PayloadMediaSize;
  };
  createdAt: string;
  updatedAt: string;
}

interface PayloadListResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function pickThumb(doc: PayloadMediaDoc): string {
  return resolveMediaUrl(doc.sizes?.thumbnail?.url ?? doc.url);
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: PayloadUser; token?: string; exp?: number }>(
      `/api/users/login`,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    ),
  logout: () =>
    request<{ message?: string }>(`/api/users/logout`, { method: "POST" }),
  me: () => request<{ user: PayloadUser | null }>(`/api/users/me`),
  register: (email: string, password: string) =>
    requestDoc<PayloadUser>(`/api/users`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  listSites: (limit = 50) =>
    request<PayloadListResponse<PayloadSiteDoc>>(
      `/api/sites?limit=${limit}&sort=-updatedAt&depth=0`,
    ),
  createSite: (data: {
    name: string;
    slug: string;
    domain: string;
    theme?: Theme;
  }) =>
    requestDoc<PayloadSiteDoc>(`/api/sites`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteSite: (id: string) =>
    requestDoc<{ id: string }>(`/api/sites/${id}`, { method: "DELETE" }),
  getPage: (id: string) => request<PayloadPageDoc>(`/api/pages/${id}`),
  getSite: (id: string) => request<PayloadSiteDoc>(`/api/sites/${id}`),
  updateSite: (
    id: string,
    data: {
      theme?: Theme;
      name?: string;
      header?: Block[];
      footer?: Block[];
    },
  ) =>
    requestDoc<PayloadSiteDoc>(`/api/sites/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  listPages: (siteId: string) =>
    request<PayloadListResponse<PayloadPageDoc>>(
      `/api/pages?where[site][equals]=${encodeURIComponent(siteId)}&limit=200&sort=title&depth=0`,
    ),
  createPage: (data: {
    title: string;
    slug: string;
    site: string;
    layout?: unknown[];
  }) =>
    requestDoc<PayloadPageDoc>(`/api/pages`, {
      method: "POST",
      body: JSON.stringify({ layout: [], ...data }),
    }),
  deletePage: (id: string) =>
    requestDoc<{ id: string }>(`/api/pages/${id}`, { method: "DELETE" }),
  updatePage: (
    id: string,
    data: {
      title?: string;
      layout?: unknown[];
      description?: string;
      metaImage?: string;
    },
  ) =>
    requestDoc<PayloadPageDoc>(`/api/pages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  duplicatePage: async (id: string): Promise<PayloadPageDoc> => {
    const src = await request<PayloadPageDoc>(`/api/pages/${id}`);
    const siteId =
      typeof src.site === "string" ? src.site : src.site.id;
    const baseSlug = src.slug;
    const baseTitle = src.title;
    const suffix = Math.random().toString(36).slice(2, 7);
    return requestDoc<PayloadPageDoc>(`/api/pages`, {
      method: "POST",
      body: JSON.stringify({
        title: `${baseTitle} copy`,
        slug: `${baseSlug}-copy-${suffix}`,
        site: siteId,
        layout: src.layout ?? [],
        description: src.description ?? undefined,
        metaImage: src.metaImage ?? undefined,
      }),
    });
  },
  preview: (id: string) =>
    request<PayloadPageDoc>(`/api/pages/preview/${id}`),
  publishPage: (id: string) =>
    request<PayloadPageDoc>(`/api/pages/${id}/publish`, { method: "POST" }),
  listMedia: (siteId: string, limit = 60) =>
    request<PayloadListResponse<PayloadMediaDoc>>(
      `/api/media?where[site][equals]=${encodeURIComponent(siteId)}&limit=${limit}&sort=-createdAt&depth=0`,
    ),
  uploadMedia: async (
    file: File,
    siteId: string,
    alt?: string,
  ): Promise<PayloadMediaDoc> => {
    const form = new FormData();
    form.append("file", file);
    form.append(
      "_payload",
      JSON.stringify({ site: siteId, alt: alt ?? file.name }),
    );
    const res = await fetch(`${API_URL}/api/media`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Upload failed ${res.status}: ${body}`);
    }
    const json = (await res.json()) as { doc: PayloadMediaDoc };
    return json.doc;
  },
};
