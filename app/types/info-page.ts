// Information pages linked from the footer (#107): the help pages and the
// "Świat Fashion" pages. Their copy lives in i18n (`pages.<id>.*`) for now;
// the shape below is kept uniform (a page with sections, a section with
// blocks) so that moving it to Payload later changes the source, not the
// markup. The registry with every page's path and status is INFO_PAGES in
// app/utils/info-pages.ts.

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
} as const

export type InfoPageGroup =
  (typeof INFO_PAGE_GROUP)[keyof typeof INFO_PAGE_GROUP]

// The page ids double as the i18n key segment: `pages.<id>.*`
export const INFO_PAGE_IDS = [
  'shippingAndPayments',
  'returns',
  'sizeGuide',
  'trackOrder',
  'faq',
] as const

export type InfoPageId = (typeof INFO_PAGE_IDS)[number]

// One block of a section. Every `key` is relative to the section's own i18n
// key (`pages.<page>.sections.<section>.`), so the definition stays short.
export type InfoBlock =
  // A paragraph
  | { kind: 'text'; key: string }
  // A paragraph that stands in for a fact the owner has to supply (a return
  // address, a price, a vacancy). It is shown in neutral wording and marked
  // `TODO(owner)` where it is defined; never replace it with an invented
  // value, only with the owner's.
  | { kind: 'placeholder'; key: string }
  // A bulleted or numbered list: `<key>.1` ... `<key>.<items>`
  | { kind: 'list'; key: string; items: number; ordered?: boolean }
  // A link to another page of the store (a path relative to the country)
  | { kind: 'link'; key: string; to: string }
  // The size table shared with the product page (AppSizeTable)
  | { kind: 'sizeTable' }
  // Questions and answers: `<key>.<question>.q` / `.a`, shown as an
  // accordion (InfoFaq) and, on a published page, as FAQPage JSON-LD
  | { kind: 'faq'; key: string; questions: string[] }
  // The contact details from the Payload footer global (hidden without them)
  | { kind: 'contact' }
  // The articles of the Payload journal global (hidden without them)
  | { kind: 'journal' }

export type InfoSection = {
  // Anchor of the section and its i18n key: `pages.<page>.sections.<id>`,
  // whose `heading` is the section's h2
  id: string
  blocks: InfoBlock[]
}

export type InfoPage = {
  id: InfoPageId
  // Route under /[countryCode], as the owner enters it in the footer
  path: string
  group: InfoPageGroup
  status: InfoPageStatus
  // A table of contents for a long page
  toc?: boolean
  // Ends the page with the shared "Any questions?" block and the contact
  // details from the Payload footer (`pages.info.contact.*`)
  contact?: boolean
  sections: InfoSection[]
}

// A question with its answer, already translated
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
