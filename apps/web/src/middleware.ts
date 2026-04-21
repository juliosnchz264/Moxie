import { defineMiddleware } from 'astro:middleware';
import { fetchSiteByDomain } from './lib/api';

export const onRequest = defineMiddleware(async (context, next) => {
  const host = context.request.headers.get('host') ?? '';
  const domain = host.split(':')[0] ?? host;

  let site = await fetchSiteByDomain(domain);
  if (!site) {
    const fallback = import.meta.env.DEFAULT_SITE_DOMAIN;
    if (fallback && fallback !== domain) {
      site = await fetchSiteByDomain(fallback);
    }
  }
  if (site) {
    context.locals.siteId = site.id;
    context.locals.site = site;
  }

  return next();
});
