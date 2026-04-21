import type { APIRoute } from 'astro';
import { fetchPublishedPages } from '../lib/api';

export const GET: APIRoute = async ({ locals, request }) => {
  const siteId = locals.siteId;
  if (!siteId) {
    return new Response('Unknown domain', { status: 404 });
  }

  const host = (request.headers.get('host') ?? '').split(':')[0];
  const origin = `https://${host}`;
  const pages = await fetchPublishedPages(siteId);

  const urls = pages
    .map((p) => {
      const loc = p.slug === 'home' ? `${origin}/` : `${origin}/${p.slug}`;
      const lastmod = (p.publishedAt ?? p.updatedAt ?? '').slice(0, 10);
      return `  <url>\n    <loc>${loc}</loc>${
        lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
      }\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
};
