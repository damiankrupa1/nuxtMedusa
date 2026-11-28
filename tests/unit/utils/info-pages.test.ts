import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { payloadInfoPages } from '~~/tests/fixtures/cms'
import { CMS_INFO_PAGE_SLUGS, cmsInfoPageSchema } from '~/types/cms'
import type { CmsInfoPage } from '~/types/cms'
import { INFO_PAGE_IDS, INFO_PAGE_STATUS } from '~/types/info-page'
import type { InfoPage } from '~/types/info-page'
import {
  INFO_PAGES,
  collectInfoPageFaqEntries,
  getIndexableInfoPagePaths,
  getInfoPage,
  getInfoPageRobots,
  isIndexableInfoPage,
} from '~/utils/info-pages'

const published = (page: InfoPage): InfoPage => ({
  ...page,
  status: INFO_PAGE_STATUS.published,
})

const parse = (slug: keyof typeof payloadInfoPages) =>
  cmsInfoPageSchema.parse(payloadInfoPages[slug]) as CmsInfoPage

describe('information pages', () => {
  it('has the routes of the footer and the legal pages, one page per id', () => {
    expect(
      Object.fromEntries(INFO_PAGES.map((page) => [page.id, page.path])),
    ).toEqual({
      shippingAndPayments: '/help/shipping-and-payments',
      returns: '/help/returns',
      sizeGuide: '/help/size-guide',
      trackOrder: '/help/track-order',
      faq: '/help/faq',
      about: '/about',
      studio: '/studio',
      journal: '/journal',
      materialsAndCare: '/materials-and-care',
      careers: '/careers',
      terms: '/terms',
      privacy: '/privacy',
      cookies: '/cookies',
      accessibility: '/accessibility',
    })
    expect(INFO_PAGES.map((page) => page.id)).toEqual([...INFO_PAGE_IDS])
  })

  it('reads every page from its own Payload global', () => {
    expect(INFO_PAGES.map((page) => page.slug).sort()).toEqual(
      [...CMS_INFO_PAGE_SLUGS].sort(),
    )
  })

  it('has a page file for every route', () => {
    INFO_PAGES.forEach((page) => {
      // Vitest runs from the project root
      const file = resolve(`app/pages/[countryCode]${page.path}.vue`)
      expect(existsSync(file), file).toBe(true)
    })
  })

  it('finds a page by id', () => {
    expect(getInfoPage('faq').path).toBe('/help/faq')
    expect(getInfoPage('terms').slug).toBe('info-terms')
  })

  describe('draft gate', () => {
    it('keeps every page a draft until the owner has reviewed it', () => {
      INFO_PAGES.forEach((page) => {
        expect(page.status, page.id).toBe(INFO_PAGE_STATUS.draft)
      })
    })

    it('marks a draft noindex and leaves it out of the sitemap', () => {
      const draft = getInfoPage('returns')

      expect(isIndexableInfoPage(draft)).toBe(false)
      expect(getInfoPageRobots(draft)).toBe('noindex, follow')
      expect(getIndexableInfoPagePaths([draft])).toEqual([])
      expect(getIndexableInfoPagePaths()).toEqual([])
    })

    it('indexes a published page and lists it in the sitemap', () => {
      const page = published(getInfoPage('returns'))

      expect(isIndexableInfoPage(page)).toBe(true)
      expect(getInfoPageRobots(page)).toBeUndefined()
      expect(getIndexableInfoPagePaths([page, getInfoPage('faq')])).toEqual([
        '/help/returns',
      ])
    })
  })

  describe('FAQ entries', () => {
    it('lists every question of a page in page order', () => {
      expect(collectInfoPageFaqEntries(parse('info-faq'))).toEqual([
        {
          question: 'How do I place an order?',
          answer: 'Add a product to the cart and check out.',
        },
        {
          question: 'Can I change an order?',
          answer: 'Write to us before it ships.',
        },
        {
          question: 'How can I pay?',
          answer: 'By card, BLIK or Przelewy24.',
        },
      ])
    })

    it('has none on a page without questions', () => {
      expect(collectInfoPageFaqEntries(parse('info-returns'))).toEqual([])
    })
  })
})
