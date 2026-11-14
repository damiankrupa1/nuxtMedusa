import { defineComponent, h, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useCookie, useNuxtApp, useState } from 'nuxt/app'

import regionMiddleware from '~/middleware/region.global'

const mocks = vi.hoisted(() => ({
  countries: undefined as
    Array<{ iso_2: string; region_id: string }> | undefined,
  navigateTo: vi.fn((path: string) => path),
}))

mockNuxtImport('useCountries', () =>
  vi.fn(async () => ({ value: mocks.countries })),
)
mockNuxtImport('navigateTo', () => mocks.navigateTo)

describe('region middleware in Nuxt', () => {
  const countries = [
    { iso_2: 'de', region_id: 'reg_de' },
    { iso_2: 'pl', region_id: 'reg_pl' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.countries = countries
  })

  const runMiddleware = async (path: string, savedCountryCode?: string) => {
    let result: unknown
    let selectedCountry: string | undefined
    let locale = ''
    const Harness = defineComponent({
      async setup() {
        const { $i18n } = useNuxtApp()
        const countryCode = useCookie('country_code')
        countryCode.value = savedCountryCode ?? ''
        useState('country').value = null
        await nextTick()
        result = await regionMiddleware(
          {
            path: path.split('?')[0] ?? path,
            fullPath: path,
          } as Parameters<typeof regionMiddleware>[0],
          {} as Parameters<typeof regionMiddleware>[1],
        )
        selectedCountry = useState<{ iso_2: string } | null>('country').value
          ?.iso_2
        locale = $i18n.locale.value

        return () => h('output', String(result ?? 'continued'))
      },
    })

    const wrapper = await mountSuspended(Harness)
    return { result, selectedCountry, locale, wrapper }
  }

  it('lets the URL override a saved country and sets the real locale', async () => {
    const { result, selectedCountry, locale, wrapper } = await runMiddleware(
      '/de/products/shorts',
      'pl',
    )

    expect(result).toBeUndefined()
    expect(selectedCountry).toBe('de')
    expect(locale).toBe('en')
    expect(wrapper.text()).toBe('continued')
    expect(mocks.navigateTo).not.toHaveBeenCalled()
  })

  it('redirects with the saved country or configured default', async () => {
    const saved = await runMiddleware('/store?page=2', 'de')
    expect(saved.result).toBe('/de/store?page=2')
    expect(mocks.navigateTo).toHaveBeenCalledWith('/de/store?page=2')

    mocks.navigateTo.mockClear()
    const fallback = await runMiddleware('/')
    expect(fallback.result).toBe('/pl/')
    expect(mocks.navigateTo).toHaveBeenCalledWith('/pl/')

    mocks.navigateTo.mockClear()
    const invalidSavedCountry = await runMiddleware('/store', 'fr')
    expect(invalidSavedCountry.result).toBe('/pl/store')
    expect(mocks.navigateTo).toHaveBeenCalledWith('/pl/store')
  })

  describe('unknown country in the URL', () => {
    it('replaces a country-like first segment, keeping path, query and hash', async () => {
      const { result, selectedCountry, locale } =
        await runMiddleware('/xx/store?x=1#h')

      expect(result).toBe('/pl/store?x=1#h')
      expect(mocks.navigateTo).toHaveBeenCalledWith('/pl/store?x=1#h')
      expect(selectedCountry).toBe('pl')
      expect(locale).toBe('pl')
    })

    it('picks the target from the saved country, then the default', async () => {
      const saved = await runMiddleware('/xx/products/shorts', 'de')
      expect(saved.result).toBe('/de/products/shorts')
      expect(saved.selectedCountry).toBe('de')

      const staleCookie = await runMiddleware('/xx/products/shorts', 'fr')
      expect(staleCookie.result).toBe('/pl/products/shorts')
    })

    it('replaces the segment on its own, with or without a trailing slash', async () => {
      expect((await runMiddleware('/xx')).result).toBe('/pl')
      expect((await runMiddleware('/xx/')).result).toBe('/pl/')
      expect((await runMiddleware('/xx?page=2')).result).toBe('/pl?page=2')
      expect((await runMiddleware('/xx/store/')).result).toBe('/pl/store/')
    })

    it('treats the segment in any case as a country code', async () => {
      expect((await runMiddleware('/XX/store')).result).toBe('/pl/store')
      expect((await runMiddleware('/Xx/store', 'de')).result).toBe('/de/store')
    })

    it('keeps the region of the URL when only its case differs', async () => {
      const { result, selectedCountry } = await runMiddleware(
        '/DE/store?page=2',
        'pl',
      )

      expect(result).toBe('/de/store?page=2')
      expect(selectedCountry).toBe('de')
    })

    it.each<[string, string]>([
      ['/', '/pl/'],
      ['/store', '/pl/store'],
      ['/cart', '/pl/cart'],
      ['/search?q=a', '/pl/search?q=a'],
      ['/products/shorts', '/pl/products/shorts'],
      ['/xxx/store', '/pl/xxx/store'],
      ['/x/store', '/pl/x/store'],
      ['/pl-PL/store', '/pl/pl-PL/store'],
      ['/p1/store', '/pl/p1/store'],
      ['/%78x/store', '/pl/%78x/store'],
    ])(
      'only prefixes %s, whose first segment is not a country code',
      async (path, expected) => {
        const { result } = await runMiddleware(path)

        expect(result).toBe(expected)
        expect(mocks.navigateTo).toHaveBeenCalledWith(expected)
      },
    )

    it.each([
      '/',
      '/xx',
      '/xx/store?x=1',
      '/XX/store',
      '/DE/store',
      '/store',
      '/xxx/store',
      '/pl-PL/store',
    ])(
      'settles on the first redirect of %s: no redirect loop',
      async (path) => {
        const first = await runMiddleware(path, 'de')
        expect(first.result).toEqual(expect.any(String))

        mocks.navigateTo.mockClear()
        const second = await runMiddleware(String(first.result), 'de')
        expect(second.result).toBeUndefined()
        expect(mocks.navigateTo).not.toHaveBeenCalled()
      },
    )

    it('redirects into the exact iso_2 a region is stored with', async () => {
      mocks.countries = [{ iso_2: 'PL', region_id: 'reg_pl' }]

      const lower = await runMiddleware('/pl/store')
      expect(lower.result).toBe('/PL/store')

      const exact = await runMiddleware('/PL/store')
      expect(exact.result).toBeUndefined()
      expect(exact.selectedCountry).toBe('PL')
    })

    it('does not redirect when countries are unavailable', async () => {
      mocks.countries = undefined

      const { result } = await runMiddleware('/xx/store')

      expect(result).toBeUndefined()
      expect(mocks.navigateTo).not.toHaveBeenCalled()
    })

    it('does not redirect when there are no regions', async () => {
      mocks.countries = []

      const { result } = await runMiddleware('/xx/store')

      expect(result).toBeUndefined()
      expect(mocks.navigateTo).not.toHaveBeenCalled()
    })
  })

  it('does not redirect when countries are unavailable', async () => {
    mocks.countries = undefined

    const { result, wrapper } = await runMiddleware('/store')

    expect(result).toBeUndefined()
    expect(wrapper.text()).toBe('continued')
    expect(mocks.navigateTo).not.toHaveBeenCalled()
  })
})
