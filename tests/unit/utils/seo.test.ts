import { describe, expect, it } from '@jest/globals'

import {
  buildCatalogSitemapUrls,
  buildCountryLinks,
  getHreflang,
  stripCountryCode,
  toCountryCodes,
  toCountryPath,
} from '~/utils/seo'

describe('seo utils', () => {
  describe('getHreflang', () => {
    it('pairs the locale the country is shown in with the country', () => {
      expect(getHreflang('pl')).toBe('pl-PL')
      expect(getHreflang('de')).toBe('en-DE')
      expect(getHreflang('gb')).toBe('en-GB')
    })
  })

  describe('country paths', () => {
    it('strips the country code from a route path', () => {
      expect(stripCountryCode('/pl/products/shorts')).toBe('/products/shorts')
      expect(stripCountryCode('/pl')).toBe('/')
      expect(stripCountryCode('/pl/')).toBe('/')
    })

    it('prefixes a path with a country code', () => {
      expect(toCountryPath('de', '/products/shorts')).toBe(
        '/de/products/shorts',
      )
      expect(toCountryPath('de', '/')).toBe('/de')
    })

    it('keeps only countries with a code', () => {
      expect(
        toCountryCodes([
          { iso_2: 'pl' },
          { iso_2: undefined },
          { iso_2: 'de' },
        ]),
      ).toEqual(['pl', 'de'])
      expect(toCountryCodes(undefined)).toEqual([])
    })
  })

  describe('buildCountryLinks', () => {
    const input = {
      siteUrl: 'https://shop.example.com',
      path: '/de/products/shorts',
      countryCodes: ['de', 'pl'],
      defaultCountry: 'pl',
    }

    it('links the canonical URL and every country version', () => {
      expect(buildCountryLinks(input)).toEqual([
        {
          key: 'canonical',
          rel: 'canonical',
          href: 'https://shop.example.com/de/products/shorts',
        },
        {
          key: 'alternate:en-DE',
          rel: 'alternate',
          hreflang: 'en-DE',
          href: 'https://shop.example.com/de/products/shorts',
        },
        {
          key: 'alternate:pl-PL',
          rel: 'alternate',
          hreflang: 'pl-PL',
          href: 'https://shop.example.com/pl/products/shorts',
        },
        {
          key: 'alternate:x-default',
          rel: 'alternate',
          hreflang: 'x-default',
          href: 'https://shop.example.com/pl/products/shorts',
        },
      ])
    })

    it('builds the home page URLs without a trailing slash', () => {
      const links = buildCountryLinks({
        ...input,
        siteUrl: 'https://shop.example.com/',
        path: '/pl',
      })

      expect(links.map((link) => link.href)).toEqual([
        'https://shop.example.com/pl',
        'https://shop.example.com/de',
        'https://shop.example.com/pl',
        'https://shop.example.com/pl',
      ])
    })

    it('keeps the page number of a paginated page', () => {
      const links = buildCountryLinks({
        ...input,
        path: '/pl/store',
        page: '3',
      })

      expect(links[0]?.href).toBe('https://shop.example.com/pl/store?page=3')
      expect(links.every((link) => link.href.endsWith('/store?page=3'))).toBe(
        true,
      )
    })

    it.each([undefined, '1', '0', 'abc', '2.5', ['1']])(
      'drops a page param that is not a later page (%p)',
      (page) => {
        const [canonical] = buildCountryLinks({
          ...input,
          path: '/pl/store',
          page,
        })

        expect(canonical?.href).toBe('https://shop.example.com/pl/store')
      },
    )

    it('lists a country once even if it comes twice', () => {
      const links = buildCountryLinks({
        ...input,
        countryCodes: ['de', 'de', 'pl'],
      })

      expect(links.filter((link) => link.hreflang === 'en-DE')).toHaveLength(1)
    })

    it('leaves out x-default when the default country has no region', () => {
      const links = buildCountryLinks({ ...input, defaultCountry: 'fr' })

      expect(links.some((link) => link.hreflang === 'x-default')).toBe(false)
    })

    it('builds nothing without a site URL or a country in the path', () => {
      expect(buildCountryLinks({ ...input, siteUrl: '' })).toEqual([])
      expect(buildCountryLinks({ ...input, path: '/' })).toEqual([])
    })
  })

  describe('buildCatalogSitemapUrls', () => {
    it('lists the catalog pages of every country', () => {
      const urls = buildCatalogSitemapUrls({
        countryCodes: ['pl', 'de'],
        products: [
          { handle: 'shorts', updated_at: '2026-01-02T00:00:00.000Z' },
          { handle: null },
        ],
        categories: [{ handle: 'pants' }],
        collections: [{ handle: 'summer sale' }],
      })

      expect(urls).toEqual([
        { loc: '/pl' },
        { loc: '/pl/store' },
        {
          loc: '/pl/products/shorts',
          lastmod: '2026-01-02T00:00:00.000Z',
        },
        { loc: '/pl/categories/pants' },
        { loc: '/pl/collections/summer%20sale' },
        { loc: '/de' },
        { loc: '/de/store' },
        {
          loc: '/de/products/shorts',
          lastmod: '2026-01-02T00:00:00.000Z',
        },
        { loc: '/de/categories/pants' },
        { loc: '/de/collections/summer%20sale' },
      ])
    })

    it('lists nothing without countries', () => {
      expect(
        buildCatalogSitemapUrls({
          countryCodes: [],
          products: [{ handle: 'shorts' }],
          categories: [],
          collections: [],
        }),
      ).toEqual([])
    })
  })
})
