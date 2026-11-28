// Imported explicitly by app/utils/seo.ts, which the sitemap source in
// server/ uses too, so this file imports its own dependencies
import type { CmsInfoPage } from '~/types/cms'
import { INFO_PAGE_GROUP, INFO_PAGE_STATUS } from '~/types/info-page'
import type { FaqEntry, InfoPage, InfoPageId } from '~/types/info-page'

// The information pages linked from the footer (#107, #121), the one place
// that decides their route and status. Their copy is the Payload global named
// by `slug`: a page with no published copy answers 404 (there is no static
// fallback), and the footer link itself is the owner's data in Payload's
// `footer-content`.
//
// Every page is a draft until the owner has reviewed it: `noindex` and not in
// the sitemap (getInfoPageRobots, getIndexableInfoPagePaths). Switch `status`
// to INFO_PAGE_STATUS.published once its copy is final, so a page that is
// published here must also have published copy in Payload.
//
// TODO(owner): have the returns and complaints copy, and the four legal
// pages, reviewed by a lawyer before publishing them; the placeholders
// ("…uzupełnimy wkrótce") in Payload mark the facts still missing.
export const INFO_PAGES: InfoPage[] = [
  {
    id: 'shippingAndPayments',
    slug: 'info-shipping',
    path: '/help/shipping-and-payments',
    group: INFO_PAGE_GROUP.help,
    status: INFO_PAGE_STATUS.draft,
    toc: true,
    contact: true,
  },
  {
    id: 'returns',
    slug: 'info-returns',
    path: '/help/returns',
    group: INFO_PAGE_GROUP.help,
    status: INFO_PAGE_STATUS.draft,
    toc: true,
    contact: true,
  },
  {
    id: 'sizeGuide',
    slug: 'info-size-guide',
    path: '/help/size-guide',
    group: INFO_PAGE_GROUP.help,
    status: INFO_PAGE_STATUS.draft,
    contact: true,
  },
  {
    id: 'trackOrder',
    slug: 'info-track-order',
    path: '/help/track-order',
    group: INFO_PAGE_GROUP.help,
    status: INFO_PAGE_STATUS.draft,
    contact: true,
  },
  {
    id: 'faq',
    slug: 'info-faq',
    path: '/help/faq',
    group: INFO_PAGE_GROUP.help,
    status: INFO_PAGE_STATUS.draft,
    contact: true,
  },
  {
    id: 'about',
    slug: 'info-about',
    path: '/about',
    group: INFO_PAGE_GROUP.world,
    status: INFO_PAGE_STATUS.draft,
  },
  {
    id: 'studio',
    slug: 'info-studio',
    path: '/studio',
    group: INFO_PAGE_GROUP.world,
    status: INFO_PAGE_STATUS.draft,
  },
  {
    id: 'journal',
    slug: 'info-journal',
    path: '/journal',
    group: INFO_PAGE_GROUP.world,
    status: INFO_PAGE_STATUS.draft,
  },
  {
    id: 'materialsAndCare',
    slug: 'info-materials',
    path: '/materials-and-care',
    group: INFO_PAGE_GROUP.world,
    status: INFO_PAGE_STATUS.draft,
    toc: true,
  },
  {
    id: 'careers',
    slug: 'info-careers',
    path: '/careers',
    group: INFO_PAGE_GROUP.world,
    status: INFO_PAGE_STATUS.draft,
  },
  {
    id: 'terms',
    slug: 'info-terms',
    path: '/terms',
    group: INFO_PAGE_GROUP.legal,
    status: INFO_PAGE_STATUS.draft,
    toc: true,
    contact: true,
  },
  {
    id: 'privacy',
    slug: 'info-privacy',
    path: '/privacy',
    group: INFO_PAGE_GROUP.legal,
    status: INFO_PAGE_STATUS.draft,
    toc: true,
    contact: true,
  },
  {
    id: 'cookies',
    slug: 'info-cookies',
    path: '/cookies',
    group: INFO_PAGE_GROUP.legal,
    status: INFO_PAGE_STATUS.draft,
    toc: true,
  },
  {
    id: 'accessibility',
    slug: 'info-accessibility',
    path: '/accessibility',
    group: INFO_PAGE_GROUP.legal,
    status: INFO_PAGE_STATUS.draft,
    contact: true,
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

// Every question of a page, in page order (the FAQPage JSON-LD)
export function collectInfoPageFaqEntries(content: CmsInfoPage): FaqEntry[] {
  return content.sections.flatMap((section) =>
    section.blocks.flatMap((block) =>
      block.blockType === 'faq' ? block.items : [],
    ),
  )
}
