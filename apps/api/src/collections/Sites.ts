import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'
import { validateBlock } from '@moxie/contract'
import { assertLayoutSize, assertSiteLimit } from '../lib/limits'

const enforceLimit: CollectionBeforeValidateHook = async ({
  operation,
  req,
  data,
}) => {
  if (operation === 'create') {
    await assertSiteLimit(req.payload)
  }
  return data
}

const validateSharedBlocks: CollectionBeforeChangeHook = ({ data }) => {
  for (const slot of ['header', 'footer'] as const) {
    const blocks = data[slot]
    if (Array.isArray(blocks)) {
      assertLayoutSize(blocks)
      data[slot] = blocks.map((b) => validateBlock(b))
    }
  }
  return data
}

export const Sites: CollectionConfig = {
  slug: 'sites',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'domain', 'slug'],
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  hooks: {
    beforeValidate: [enforceLimit],
    beforeChange: [validateSharedBlocks],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'domain', type: 'text', required: true, unique: true, index: true },
    {
      name: 'theme',
      type: 'json',
      admin: {
        description:
          'Design system: { preset: "light"|"dark"|"custom", colors?: {...}, fonts?: { sans?, heading? } }',
      },
      defaultValue: { preset: 'light' },
    },
    {
      name: 'header',
      type: 'json',
      admin: {
        description: 'Shared header blocks rendered above every page.',
      },
      defaultValue: [],
    },
    {
      name: 'footer',
      type: 'json',
      admin: {
        description: 'Shared footer blocks rendered below every page.',
      },
      defaultValue: [],
    },
  ],
  timestamps: true,
}
