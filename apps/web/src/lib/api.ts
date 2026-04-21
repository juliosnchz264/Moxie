import type { Block } from '@moxie/core';
import type { Theme } from '@moxie/tokens';
import { createTtlMemo } from './cache';

const API_URL = import.meta.env.PAYLOAD_API_URL ?? 'http://localhost:3000';

export interface SiteDoc {
  id: string;
  name: string;
  slug: string;
  domain: string;
  theme?: Theme | null;
  header?: Block[] | null;
  footer?: Block[] | null;
}

export interface PageDoc {
  id: string;
  title: string;
  slug: string;
  site: string | { id: string };
  status: 'draft' | 'published';
  layout: Block[];
  description?: string | null;
  metaImage?: string | null;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface FindResponse<T> {
  docs: T[];
  totalDocs: number;
}

async function findOne<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) return null;
  const body = (await res.json()) as FindResponse<T>;
  return body.docs[0] ?? null;
}

function fetchSiteByDomainImpl(domain: string): Promise<SiteDoc | null> {
  const qs = `where[domain][equals]=${encodeURIComponent(domain)}&limit=1`;
  return findOne<SiteDoc>(`/api/sites?${qs}`);
}

export const fetchSiteByDomain = createTtlMemo(fetchSiteByDomainImpl);

export function fetchPageBySlug(
  siteId: string,
  slug: string,
): Promise<PageDoc | null> {
  const qs = [
    `where[site][equals]=${encodeURIComponent(siteId)}`,
    `where[slug][equals]=${encodeURIComponent(slug)}`,
    `where[status][equals]=published`,
    `limit=1`,
  ].join('&');
  return findOne<PageDoc>(`/api/pages?${qs}`);
}

export function trackPageView(pageId: string): void {
  fetch(`${API_URL}/api/pages/${encodeURIComponent(pageId)}/track`, {
    method: 'POST',
  }).catch(() => {
    // fire-and-forget; never block render
  });
}

export async function fetchPublishedPages(
  siteId: string,
): Promise<Pick<PageDoc, 'slug' | 'updatedAt' | 'publishedAt'>[]> {
  const qs = [
    `where[site][equals]=${encodeURIComponent(siteId)}`,
    `where[status][equals]=published`,
    `limit=200`,
    `depth=0`,
  ].join('&');
  const res = await fetch(`${API_URL}/api/pages?${qs}`);
  if (!res.ok) return [];
  const body = (await res.json()) as FindResponse<PageDoc>;
  return body.docs.map((d) => ({
    slug: d.slug,
    updatedAt: d.updatedAt,
    publishedAt: d.publishedAt,
  }));
}
