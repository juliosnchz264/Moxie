interface PurgeInput {
  domain: string
  slug: string
}

export async function purgePage({ domain, slug }: PurgeInput): Promise<void> {
  const url = process.env.CACHE_PURGE_URL
  if (!url) return

  const path = slug === 'home' ? '/' : `/${slug}`
  const target = `https://${domain}${path}`
  const token = process.env.CACHE_PURGE_TOKEN

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ urls: [target] }),
    })
  } catch (e) {
    console.warn('[cache-purge] failed:', (e as Error).message)
  }
}
