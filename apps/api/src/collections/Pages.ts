import type {
  Access,
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  PayloadHandler,
} from 'payload'
import { APIError } from 'payload'
import { validateBlock } from '@moxie/contract'
import { purgePage } from '../lib/cache-purge'
import { assertLayoutSize, assertPageLimit } from '../lib/limits'

const publishedOnlyForPublic: Access = ({ req }) => {
  if (req.user) return true
  return { status: { equals: 'published' } }
}

const authOnly: Access = ({ req }) => !!req.user

const beforeValidateLimit: CollectionBeforeValidateHook = async ({
  operation,
  req,
  data,
}) => {
  if (operation === 'create' && data?.site) {
    const siteId = typeof data.site === 'string' ? data.site : data.site?.id
    if (siteId) await assertPageLimit(req.payload, siteId)
  }
  return data
}

const beforeChange: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (Array.isArray(data.layout)) {
    assertLayoutSize(data.layout)
    data.layout = data.layout.map((b) => validateBlock(b))
  }
  const wasPublished = originalDoc?.status === 'published'
  if (data.status === 'published' && !wasPublished && !data.publishedAt) {
    data.publishedAt = new Date().toISOString()
  }
  return data
}

const PURGE_FIELDS = ['layout', 'title', 'slug', 'description', 'metaImage'] as const

const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const becamePublished =
    doc.status === 'published' && previousDoc?.status !== 'published'
  const republished =
    doc.status === 'published' && previousDoc?.status === 'published'
  if (!becamePublished && !republished) return doc

  if (republished) {
    const contentChanged = PURGE_FIELDS.some(
      (f) => JSON.stringify(doc[f]) !== JSON.stringify(previousDoc?.[f]),
    )
    if (!contentChanged) return doc
  }

  const siteId = typeof doc.site === 'string' ? doc.site : doc.site?.id
  if (!siteId) return doc

  const site = await req.payload.findByID({
    collection: 'sites',
    id: siteId,
    depth: 0,
  })
  if (site?.domain) {
    await purgePage({ domain: site.domain, slug: doc.slug })
  }
  return doc
}

const previewHandler: PayloadHandler = async (req) => {
  if (!req.user) throw new APIError('Unauthorized', 401)
  const id = req.routeParams?.id
  if (typeof id !== 'string') throw new APIError('Invalid id', 400)
  const page = await req.payload.findByID({
    collection: 'pages',
    id,
    overrideAccess: false,
    user: req.user,
    depth: 1,
  })
  return Response.json(page)
}

const publishHandler: PayloadHandler = async (req) => {
  if (!req.user) throw new APIError('Unauthorized', 401)
  const id = req.routeParams?.id
  if (typeof id !== 'string') throw new APIError('Invalid id', 400)
  const page = await req.payload.update({
    collection: 'pages',
    id,
    data: { status: 'published', publishedAt: new Date().toISOString() },
    overrideAccess: false,
    user: req.user,
  })
  return Response.json(page)
}

const trackHandler: PayloadHandler = async (req) => {
  const id = req.routeParams?.id
  if (typeof id !== 'string') throw new APIError('Invalid id', 400)
  const current = (await req.payload.findByID({
    collection: 'pages',
    id,
    depth: 0,
    overrideAccess: true,
  })) as { status?: string; views?: number | null } | null
  if (!current || current.status !== 'published') {
    return Response.json({ ok: false }, { status: 404 })
  }
  await req.payload.update({
    collection: 'pages',
    id,
    data: {
      views: (current.views ?? 0) + 1,
      lastVisitedAt: new Date().toISOString(),
    } as Record<string, unknown>,
    overrideAccess: true,
  })
  return Response.json({ ok: true })
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'site', 'status'],
  },
  access: {
    read: publishedOnlyForPublic,
    create: authOnly,
    update: authOnly,
    delete: authOnly,
  },
  hooks: {
    beforeValidate: [beforeValidateLimit],
    beforeChange: [beforeChange],
    afterChange: [afterChange],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, index: true },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      required: true,
      index: true,
    },
    {
      name: 'layout',
      type: 'json',
      required: true,
      defaultValue: [],
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Meta description for SEO and social sharing.',
      },
    },
    {
      name: 'metaImage',
      type: 'text',
      admin: {
        description: 'Absolute URL for og:image / twitter:image.',
      },
    },
    { name: 'publishedAt', type: 'date' },
    {
      name: 'views',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, description: 'Public page-view counter.' },
    },
    {
      name: 'lastVisitedAt',
      type: 'date',
      admin: { readOnly: true, description: 'Last public visit timestamp.' },
    },
  ],
  indexes: [{ fields: ['site', 'slug'], unique: true }],
  endpoints: [
    { path: '/preview/:id', method: 'get', handler: previewHandler },
    { path: '/:id/publish', method: 'post', handler: publishHandler },
    { path: '/:id/track', method: 'post', handler: trackHandler },
  ],
  timestamps: true,
}
