import type { CmsGlobalSlug } from '~/types/cms'

// Payload REST answers for each global, as Payload sends them: with its own
// id/globalType/timestamps and array row ids next to the contract fields.

const payloadMeta = {
  id: 1,
  globalType: 'global',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

export const payloadImage = {
  id: 7,
  url: 'https://cms.example.com/media/look.jpg',
  alt: 'Model in a wool coat',
  filename: 'look.jpg',
  mimeType: 'image/jpeg',
}

const link = (label: string, url: string) => ({ id: `row-${url}`, label, url })

export const payloadGlobals = {
  navigation: {
    ...payloadMeta,
    primaryNav: [link('New in', '/store')],
  },
  'footer-content': {
    ...payloadMeta,
    helpLinks: [link('Returns', '/returns')],
    worldLinks: [link('About', '/about')],
    legalLinks: [link('Terms', '/terms')],
    contact: {
      email: 'hello@example.com',
      phone: '+48 123 456 789',
      hours: 'Mon-Fri 9-17',
    },
    social: { handle: '@fashion' },
  },
  'studio-story': {
    ...payloadMeta,
    eyebrow: 'The Studio',
    headlineLine1: 'Made slowly',
    headlineLine2: 'to last',
    paragraph1: 'First paragraph.',
    paragraph2: 'Second paragraph.',
    values: ['Wool', 'Linen', 'Repair'],
    signatureLabel: 'Since',
    signatureTagline: '2012',
    collectionLinkLabel: 'See the collection',
    collectionUrl: '/store',
    image: payloadImage,
  },
  brands: {
    ...payloadMeta,
    eyebrow: 'Selected brands',
    viewAllLabel: 'All brands',
    viewAllUrl: '/store',
    otherBrands: ['SELECTED', 'BIRKENSTOCK'],
  },
  'journal-section': {
    ...payloadMeta,
    eyebrow: 'Journal',
    heading: 'Notes',
    viewAllLabel: 'All notes',
    viewAllUrl: '/journal',
    articles: [
      {
        id: 'row-1',
        category: 'Care',
        readingTime: '4 min',
        title: 'Washing wool',
        summary: 'Less is more.',
        image: payloadImage,
        url: '/journal/wool',
      },
    ],
  },
  'campaign-slides': {
    ...payloadMeta,
    slides: [
      {
        id: 'row-1',
        seasonLabel: 'Autumn',
        editionLabel: '01',
        headlineLine1: 'Layers',
        headlineLine2: 'for October',
        description: 'Coats and knits.',
        shopCtaLabel: 'Shop',
        secondaryCtaLabel: 'For him',
        tagline: 'New season',
        captionEyebrow: 'Look 1',
        captionHeadline: 'Wool coat',
        image: payloadImage,
      },
    ],
  },
  'category-tiles': {
    ...payloadMeta,
    eyebrow: 'Categories',
    heading: 'Shop by category',
    description: 'Start here.',
    cards: [
      {
        id: 'row-1',
        title: 'Knitwear',
        subtitle: 'Sweaters and cardigans',
        categoryHandle: 'sweaters-cardigans',
        image: payloadImage,
      },
    ],
  },
  'shop-the-look': {
    ...payloadMeta,
    eyebrow: 'Shop the look',
    headlineLine1: 'One look,',
    headlineLine2: 'three pieces',
    description: 'Picked to go together.',
    captionLabel: 'Look 4',
    bottomTagline: 'Wear it all week',
    shopSetCtaLabel: 'Shop the set',
    totalLabel: 'Total',
    sizeHint: 'True to size',
    productHandles: ['wool-coat', 'linen-shirt'],
    image: payloadImage,
  },
} satisfies Record<CmsGlobalSlug, unknown>
