import { APIError, type Payload } from 'payload'

const num = (key: string, fallback: number): number => {
  const v = process.env[key]
  if (!v) return fallback
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const MAX_SITES = num('MOXIE_MAX_SITES', 5)
export const MAX_PAGES_PER_SITE = num('MOXIE_MAX_PAGES_PER_SITE', 20)
export const MAX_BLOCKS_PER_PAGE = num('MOXIE_MAX_BLOCKS_PER_PAGE', 100)
export const MAX_LAYOUT_BYTES = num('MOXIE_MAX_LAYOUT_BYTES', 256 * 1024)

export async function assertSiteLimit(payload: Payload): Promise<void> {
  const { totalDocs } = await payload.find({
    collection: 'sites',
    limit: 0,
    pagination: false,
  })
  if (totalDocs >= MAX_SITES) {
    throw new APIError(`Site limit reached (${MAX_SITES})`, 429)
  }
}

export async function assertPageLimit(
  payload: Payload,
  siteId: string,
): Promise<void> {
  const { totalDocs } = await payload.find({
    collection: 'pages',
    where: { site: { equals: siteId } },
    limit: 0,
    pagination: false,
  })
  if (totalDocs >= MAX_PAGES_PER_SITE) {
    throw new APIError(
      `Page limit reached for site (${MAX_PAGES_PER_SITE})`,
      429,
    )
  }
}

interface MaybeNode {
  children?: unknown
}

export function assertLayoutSize(layout: unknown): void {
  if (!Array.isArray(layout)) return

  let total = 0
  const walk = (blocks: unknown[]): void => {
    for (const b of blocks) {
      total++
      const children = (b as MaybeNode)?.children
      if (Array.isArray(children)) walk(children)
    }
  }
  walk(layout)

  if (total > MAX_BLOCKS_PER_PAGE) {
    throw new APIError(
      `Layout exceeds ${MAX_BLOCKS_PER_PAGE} blocks (got ${total})`,
      413,
    )
  }

  const bytes = Buffer.byteLength(JSON.stringify(layout))
  if (bytes > MAX_LAYOUT_BYTES) {
    throw new APIError(
      `Layout exceeds ${MAX_LAYOUT_BYTES} bytes (got ${bytes})`,
      413,
    )
  }
}
