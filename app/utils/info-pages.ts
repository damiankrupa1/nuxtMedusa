// Imported explicitly by app/utils/seo.ts, which the sitemap source in
// server/ uses too, so this file imports its own dependencies
import { INFO_PAGE_GROUP, INFO_PAGE_STATUS } from '~/types/info-page'
import type {
  InfoBlock,
  InfoPage,
  InfoPageId,
  InfoSection,
} from '~/types/info-page'

const text = (key: string): InfoBlock => ({ kind: 'text', key })
const placeholder = (key: string): InfoBlock => ({ kind: 'placeholder', key })
const list = (key: string, items: number, ordered = false): InfoBlock => ({
  kind: 'list',
  key,
  items,
  ordered,
})
const link = (key: string, to: string): InfoBlock => ({ kind: 'link', key, to })

// The information pages linked from the footer (#107), the one place that
// decides their route and status. Every page is a draft until the owner has
// reviewed it: `noindex` and not in the sitemap (getInfoPageRobots,
// getIndexableInfoPagePaths). Switch `status` to INFO_PAGE_STATUS.published
// once its placeholders are filled. The copy is in i18n under
// `pages.<id>.sections.<section>.<key>`; tests/unit/utils/info-pages.test.ts
// checks that every key exists in both locales.
//
// Statutory points (the 14-day withdrawal, the 2-year liability for
// non-conformity, the 14 days to answer a complaint, how a refund is paid)
// are stated in general terms only.
// TODO(owner): have the returns and complaints copy reviewed by a lawyer
// together with the terms of sale before publishing it.
export const INFO_PAGES: InfoPage[] = [
  {
    id: 'shippingAndPayments',
    path: '/help/shipping-and-payments',
    group: INFO_PAGE_GROUP.help,
    status: INFO_PAGE_STATUS.draft,
    toc: true,
    contact: true,
    sections: [
      {
        id: 'delivery',
        blocks: [text('intro'), list('methods', 2), text('checkout')],
      },
      {
        id: 'cost',
        blocks: [
          list('rules', 2),
          // TODO(owner): the price of each delivery method per country
          placeholder('prices'),
        ],
      },
      {
        id: 'time',
        blocks: [
          text('dispatch'),
          // TODO(owner): how long each carrier takes after dispatch
          placeholder('carriers'),
        ],
      },
      {
        id: 'payments',
        blocks: [text('intro'), list('methods', 3), text('security')],
      },
      {
        id: 'vat',
        blocks: [
          text('prices'),
          // TODO(owner): whether and how a VAT invoice can be requested
          placeholder('invoice'),
        ],
      },
    ],
  },
  {
    id: 'returns',
    path: '/help/returns',
    group: INFO_PAGE_GROUP.help,
    status: INFO_PAGE_STATUS.draft,
    toc: true,
    contact: true,
    sections: [
      {
        id: 'withdrawal',
        blocks: [
          text('right'),
          // TODO(owner): a return period beyond the statutory 14 days, if the
          // store offers one (the benefits bar says 30 days, see #59)
          placeholder('period'),
        ],
      },
      {
        id: 'steps',
        blocks: [
          list('items', 4, true),
          // TODO(owner): the return address
          placeholder('address'),
          // TODO(owner): who pays for sending the parcel back
          placeholder('cost'),
        ],
      },
      {
        id: 'refund',
        blocks: [list('rules', 3)],
      },
      {
        id: 'complaints',
        blocks: [
          text('liability'),
          list('steps', 3, true),
          text('answer'),
          // TODO(owner): where to send a faulty product and who pays for it
          placeholder('address'),
        ],
      },
    ],
  },
  {
    id: 'sizeGuide',
    path: '/help/size-guide',
    group: INFO_PAGE_GROUP.help,
    status: INFO_PAGE_STATUS.draft,
    contact: true,
    sections: [
      {
        id: 'table',
        blocks: [
          text('intro'),
          { kind: 'sizeTable' },
          // TODO(owner): the table is the product page's mock (#58); replace
          // it with the store's measurements (Payload `size-guide` global)
          placeholder('source'),
        ],
      },
      {
        id: 'measure',
        blocks: [text('intro'), list('points', 3), text('between')],
      },
    ],
  },
  {
    id: 'trackOrder',
    path: '/help/track-order',
    group: INFO_PAGE_GROUP.help,
    status: INFO_PAGE_STATUS.draft,
    contact: true,
    sections: [
      {
        id: 'how',
        blocks: [list('steps', 3, true)],
      },
      {
        id: 'account',
        blocks: [text('intro'), link('link', '/account')],
      },
      {
        id: 'missing',
        blocks: [list('checks', 2)],
      },
    ],
  },
  {
    id: 'faq',
    path: '/help/faq',
    group: INFO_PAGE_GROUP.help,
    status: INFO_PAGE_STATUS.draft,
    contact: true,
    sections: [
      {
        id: 'orders',
        blocks: [
          { kind: 'faq', key: 'questions', questions: ['place', 'change'] },
        ],
      },
      {
        id: 'delivery',
        blocks: [
          { kind: 'faq', key: 'questions', questions: ['methods', 'track'] },
        ],
      },
      {
        id: 'payments',
        blocks: [{ kind: 'faq', key: 'questions', questions: ['methods'] }],
      },
      {
        id: 'returns',
        blocks: [
          { kind: 'faq', key: 'questions', questions: ['how', 'refund'] },
        ],
      },
      {
        id: 'sizes',
        blocks: [{ kind: 'faq', key: 'questions', questions: ['choose'] }],
      },
      {
        id: 'care',
        blocks: [{ kind: 'faq', key: 'questions', questions: ['wash'] }],
      },
      {
        id: 'account',
        blocks: [
          { kind: 'faq', key: 'questions', questions: ['needed', 'create'] },
        ],
      },
    ],
  },
  {
    id: 'about',
    path: '/about',
    group: INFO_PAGE_GROUP.world,
    status: INFO_PAGE_STATUS.draft,
    sections: [
      {
        id: 'story',
        // The home page's studio-story section tells the story; this page
        // links to it instead of repeating it
        blocks: [text('p1'), text('p2'), link('link', '/#studio-story')],
      },
      {
        id: 'values',
        blocks: [list('items', 3)],
      },
      {
        id: 'company',
        blocks: [
          // TODO(owner): the company name, registered address and register
          // numbers, as in the terms of sale
          placeholder('details'),
          link('link', '/store'),
        ],
      },
    ],
  },
  {
    id: 'studio',
    path: '/studio',
    group: INFO_PAGE_GROUP.world,
    status: INFO_PAGE_STATUS.draft,
    sections: [
      {
        id: 'atelier',
        blocks: [
          text('intro'),
          // TODO(owner): where the studio is, who works there and which
          // workshops sew the clothes
          placeholder('place'),
        ],
      },
      {
        id: 'process',
        // TODO(owner): confirm that these steps describe how the line is
        // really made, or correct them
        blocks: [list('steps', 4, true)],
      },
      {
        id: 'collection',
        blocks: [text('intro'), link('link', '/store')],
      },
    ],
  },
  {
    id: 'journal',
    path: '/journal',
    group: INFO_PAGE_GROUP.world,
    status: INFO_PAGE_STATUS.draft,
    sections: [
      {
        id: 'articles',
        blocks: [{ kind: 'journal' }],
      },
    ],
  },
  {
    id: 'materialsAndCare',
    path: '/materials-and-care',
    group: INFO_PAGE_GROUP.world,
    status: INFO_PAGE_STATUS.draft,
    toc: true,
    sections: [
      { id: 'label', blocks: [text('intro'), list('tips', 3)] },
      { id: 'wool', blocks: [text('intro'), list('care', 3)] },
      { id: 'cotton', blocks: [text('intro'), list('care', 3)] },
      { id: 'linen', blocks: [text('intro'), list('care', 3)] },
      { id: 'silk', blocks: [text('intro'), list('care', 3)] },
      { id: 'storage', blocks: [list('tips', 3)] },
    ],
  },
  {
    id: 'careers',
    path: '/careers',
    group: INFO_PAGE_GROUP.world,
    status: INFO_PAGE_STATUS.draft,
    sections: [
      {
        id: 'team',
        blocks: [text('intro')],
      },
      {
        id: 'openings',
        blocks: [
          // TODO(owner): the open positions, if any (none are invented here)
          placeholder('none'),
        ],
      },
      {
        id: 'apply',
        blocks: [
          text('intro'),
          { kind: 'contact' },
          // TODO(owner): the recruitment privacy notice (who processes the
          // CV, for how long), to be written with a lawyer
          placeholder('privacy'),
        ],
      },
    ],
  },
]

export function getInfoPage(id: InfoPageId): InfoPage {
  const page = INFO_PAGES.find((infoPage) => infoPage.id === id)
  if (!page) throw new Error(`Unknown information page: ${id}`)
  return page
}

export function isIndexableInfoPage(page: InfoPage): boolean {
  return page.status === INFO_PAGE_STATUS.published
}

// The robots meta of an information page: a draft is kept out of the index
// (and still followed, so its links count); a published page has none.
export function getInfoPageRobots(page: InfoPage): string | undefined {
  return isIndexableInfoPage(page) ? undefined : 'noindex, follow'
}

// Paths (relative to the country) of the pages that go into the sitemap
export function getIndexableInfoPagePaths(
  pages: InfoPage[] = INFO_PAGES,
): string[] {
  return pages.filter(isIndexableInfoPage).map((page) => page.path)
}

// `pages.<page>.sections.<section>`
export function toInfoSectionKey(page: InfoPage, section: InfoSection): string {
  return `pages.${page.id}.sections.${section.id}`
}

// The i18n keys of one FAQ block's questions and answers
export function toFaqKeys(
  sectionKey: string,
  block: Extract<InfoBlock, { kind: 'faq' }>,
): { question: string; answer: string }[] {
  return block.questions.map((question) => ({
    question: `${sectionKey}.${block.key}.${question}.q`,
    answer: `${sectionKey}.${block.key}.${question}.a`,
  }))
}

// Every question of a page, in page order (the FAQPage JSON-LD)
export function collectInfoPageFaqKeys(
  page: InfoPage,
): { question: string; answer: string }[] {
  return page.sections.flatMap((section) =>
    section.blocks.flatMap((block) =>
      block.kind === 'faq'
        ? toFaqKeys(toInfoSectionKey(page, section), block)
        : [],
    ),
  )
}

// Every i18n key a page renders, for the locale completeness test
export function collectInfoPageKeys(page: InfoPage): string[] {
  const pageKeys = ['title', 'description', 'eyebrow', 'heading', 'lead'].map(
    (key) => `pages.${page.id}.${key}`,
  )

  const sectionKeys = page.sections.flatMap((section) => {
    const base = toInfoSectionKey(page, section)
    const blockKeys = section.blocks.flatMap((block): string[] => {
      switch (block.kind) {
        case 'text':
        case 'placeholder':
        case 'link':
          return [`${base}.${block.key}`]
        case 'list':
          return Array.from(
            { length: block.items },
            (_, index) => `${base}.${block.key}.${index + 1}`,
          )
        case 'faq':
          return toFaqKeys(base, block).flatMap(({ question, answer }) => [
            question,
            answer,
          ])
        default:
          return []
      }
    })
    return [`${base}.heading`, ...blockKeys]
  })

  return [...pageKeys, ...sectionKeys]
}
