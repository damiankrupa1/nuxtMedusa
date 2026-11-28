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

// An information page (#121) as Payload sends it, with row ids on sections and
// blocks next to the contract fields
type InfoBlockFixture = { blockType: string } & Record<string, unknown>

const infoBlock = (block: InfoBlockFixture, index = 0) => ({
  id: `block-${index}`,
  ...block,
})

const infoSection = (
  anchor: string,
  heading: string,
  blocks: InfoBlockFixture[],
) => ({
  id: `section-${anchor}`,
  anchor,
  heading,
  blocks: blocks.map(infoBlock),
})

const infoPage = (
  title: string,
  sections: ReturnType<typeof infoSection>[],
  heading = `${title}, in short`,
) => ({
  ...payloadMeta,
  title,
  description: `About: ${title.toLowerCase()}.`,
  eyebrow: 'HELP',
  heading,
  lead: `What to know about ${title.toLowerCase()}.`,
  sections,
  _status: 'published',
})

const text = (value: string) => ({ blockType: 'text', text: value })
const items = (...values: string[]) =>
  values.map((value, index) => ({ id: `item-${index}`, text: value }))
const simpleInfoPage = (title: string) =>
  infoPage(title, [infoSection('overview', 'Overview', [text('Details.')])])

// Payload answers `{}` for a global that has no published version, like the
// four legal pages until the owner has written them
export const payloadInfoPages = {
  'info-shipping': infoPage('Delivery and payments', [
    infoSection('delivery', 'Delivery', [
      text('We deliver with InPost.'),
      { blockType: 'list', ordered: false, items: items('Parcel locker') },
    ]),
  ]),
  'info-returns': infoPage('Returns and complaints', [
    infoSection('withdrawal', 'Returns: withdrawing from the contract', [
      text('You can withdraw from the contract within 14 days.'),
      {
        blockType: 'placeholder',
        text: 'The return address will be added soon.',
      },
    ]),
    infoSection('steps', 'How to return a product', [
      {
        blockType: 'list',
        ordered: true,
        items: items('Write to us', 'Pack the product'),
      },
    ]),
    infoSection('refund', 'Refunds', [
      {
        blockType: 'list',
        ordered: false,
        items: items('Same payment method'),
      },
    ]),
    infoSection('complaints', 'Complaints', [
      text('We answer within 14 days.'),
    ]),
  ]),
  'info-size-guide': infoPage('Size guide', [
    infoSection('table', 'Size table', [
      text('Approximate measurements.'),
      { blockType: 'sizeTable' },
    ]),
  ]),
  'info-track-order': infoPage('Track your order', [
    infoSection('account', 'Have an account?', [
      text('Sign in to see your orders.'),
      { blockType: 'link', label: 'Go to your account', to: '/account' },
    ]),
  ]),
  'info-faq': infoPage('Frequently asked questions', [
    infoSection('orders', 'Orders', [
      {
        blockType: 'faq',
        items: [
          {
            id: 'q-1',
            question: 'How do I place an order?',
            answer: 'Add a product to the cart and check out.',
          },
          {
            id: 'q-2',
            question: 'Can I change an order?',
            answer: 'Write to us before it ships.',
          },
        ],
      },
    ]),
    infoSection('payments', 'Payments', [
      {
        blockType: 'faq',
        items: [
          {
            id: 'q-3',
            question: 'How can I pay?',
            answer: 'By card, BLIK or Przelewy24.',
          },
        ],
      },
    ]),
  ]),
  'info-about': simpleInfoPage('About us'),
  'info-studio': simpleInfoPage('Fashion Studio'),
  'info-journal': infoPage('Journal', [
    infoSection('articles', 'Latest articles', [{ blockType: 'journal' }]),
  ]),
  'info-materials': infoPage('Materials and care', [
    infoSection('wool', 'Wool', [text('Air it more, wash it less.')]),
    infoSection('linen', 'Linen', [text('Wash it cool.')]),
  ]),
  'info-careers': infoPage('Careers', [
    infoSection('apply', 'How to apply', [
      text('Write to us.'),
      { blockType: 'contact' },
    ]),
  ]),
  'info-terms': {},
  'info-privacy': {},
  'info-cookies': {},
  'info-accessibility': {},
}

export const payloadGlobals = {
  ...payloadInfoPages,
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
