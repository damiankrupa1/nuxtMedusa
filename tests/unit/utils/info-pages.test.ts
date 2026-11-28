import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import en from '~~/i18n/locales/en.json'
import pl from '~~/i18n/locales/pl.json'
import { INFO_PAGE_IDS, INFO_PAGE_STATUS } from '~/types/info-page'
import type { InfoPage } from '~/types/info-page'
import {
  INFO_PAGES,
  collectInfoPageFaqKeys,
  collectInfoPageKeys,
  getIndexableInfoPagePaths,
  getInfoPage,
  getInfoPageRobots,
  isIndexableInfoPage,
} from '~/utils/info-pages'

type Messages = { [key: string]: string | Messages }

const locales = { pl, en } as unknown as Record<string, Messages>

const lookup = (messages: Messages, key: string): unknown =>
  key
    .split('.')
    .reduce<unknown>(
      (node, segment) =>
        node && typeof node === 'object'
          ? (node as Messages)[segment]
          : undefined,
      messages,
    )

// Every leaf key under a prefix, e.g. all of `pages.faq`
const leafKeys = (node: unknown, prefix: string): string[] =>
  node && typeof node === 'object'
    ? Object.entries(node).flatMap(([key, child]) =>
        leafKeys(child, `${prefix}.${key}`),
      )
    : [prefix]

const published = (page: InfoPage): InfoPage => ({
  ...page,
  status: INFO_PAGE_STATUS.published,
})

describe('information pages', () => {
  it('has the routes agreed in #107, one page per id', () => {
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
    })
    expect(INFO_PAGES.map((page) => page.id)).toEqual([...INFO_PAGE_IDS])
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

  describe('copy', () => {
    it.each(Object.keys(locales))(
      'has every key a page renders in %s, and no other',
      (locale) => {
        const messages = locales[locale]!

        INFO_PAGES.forEach((page) => {
          const keys = collectInfoPageKeys(page)

          keys.forEach((key) => {
            const value = lookup(messages, key)
            expect(typeof value, key).toBe('string')
            expect(value, key).not.toBe('')

            // A linked message (`@:app.footer.tagline`) must point at a text
            const linked = /^@:([\w.]+)$/.exec(value as string)?.[1]
            if (linked)
              expect(typeof lookup(messages, linked), key).toBe('string')
          })

          expect(
            leafKeys(lookup(messages, `pages.${page.id}`), `pages.${page.id}`),
          ).toEqual(expect.arrayContaining(keys))
          expect(
            leafKeys(lookup(messages, `pages.${page.id}`), `pages.${page.id}`),
          ).toHaveLength(keys.length)
        })
      },
    )

    it('keeps the shared chrome in both locales', () => {
      expect(leafKeys(lookup(locales.pl!, 'pages.info'), 'pages.info')).toEqual(
        leafKeys(lookup(locales.en!, 'pages.info'), 'pages.info'),
      )
    })

    it('asks 8 to 12 questions on the FAQ page', () => {
      const questions = collectInfoPageFaqKeys(getInfoPage('faq'))

      expect(questions.length).toBeGreaterThanOrEqual(8)
      expect(questions.length).toBeLessThanOrEqual(12)
      expect(questions[0]).toEqual({
        question: 'pages.faq.sections.orders.questions.place.q',
        answer: 'pages.faq.sections.orders.questions.place.a',
      })
    })

    it('has no questions on the other pages', () => {
      expect(collectInfoPageFaqKeys(getInfoPage('returns'))).toEqual([])
    })
  })
})
