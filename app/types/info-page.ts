import type { CmsInfoPageSlug } from '~/types/cms'

// Information pages linked from the footer (#107, #121): the help pages, the
// "Świat Fashion" pages and the legal pages. The storefront keeps their
// structure (which pages exist, route, footer group, status), in INFO_PAGES
// (app/utils/info-pages.ts); the copy is a Payload global per page
// (CMS_INFO_PAGE_SLUGS in app/types/cms.ts).

// A draft page is rendered, but `noindex` and left out of the sitemap, until
// the owner has reviewed its facts and switches it to `published`.
export const INFO_PAGE_STATUS = {
  draft: 'draft',
  published: 'published',
} as const

export type InfoPageStatus =
  (typeof INFO_PAGE_STATUS)[keyof typeof INFO_PAGE_STATUS]

// Footer column a page belongs to; also the middle step of its breadcrumb
export const INFO_PAGE_GROUP = {
  help: 'help',
  world: 'world',
  legal: 'legal',
} as const

export type InfoPageGroup =
  (typeof INFO_PAGE_GROUP)[keyof typeof INFO_PAGE_GROUP]

export const INFO_PAGE_IDS = [
  'shippingAndPayments',
  'returns',
  'sizeGuide',
  'trackOrder',
  'faq',
  'about',
  'studio',
  'journal',
  'materialsAndCare',
  'careers',
  'terms',
  'privacy',
  'cookies',
  'accessibility',
] as const

export type InfoPageId = (typeof INFO_PAGE_IDS)[number]

export type InfoPage = {
  id: InfoPageId
  // The Payload global that holds the page's copy
  slug: CmsInfoPageSlug
  // Route under /[countryCode], as the owner enters it in the footer
  path: string
  group: InfoPageGroup
  status: InfoPageStatus
  // A table of contents for a long page
  toc?: boolean
  // Ends the page with the shared "Any questions?" block and the contact
  // details from the Payload footer (`pages.info.contact.*`)
  contact?: boolean
}

// A question with its answer
export type FaqEntry = {
  question: string
  answer: string
}

export type FaqPageJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: {
    '@type': 'Question'
    name: string
    acceptedAnswer: { '@type': 'Answer'; text: string }
  }[]
}
