import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals'
import { ref } from 'vue'

import { getCountryFromCountryCode } from '~/utils/country'
import { getLocaleFromCountryCode } from '~/utils/locale'
import type { BaseRegionCountryWithRegionId } from '~/types/country'

type Middleware = (to: { path: string; fullPath: string }) => Promise<unknown>

describe('region middleware', () => {
  const country = (iso_2: string) =>
    ({ iso_2, region_id: `reg_${iso_2}` }) as BaseRegionCountryWithRegionId

  const countries = ref<BaseRegionCountryWithRegionId[]>()
  const savedCountryCode = ref<string>()
  const setCountry = jest.fn()
  const setLocale = jest.fn<(locale: string) => Promise<void>>()
  const navigateTo = jest.fn((path: string) => path)

  Object.assign(globalThis, {
    defineNuxtRouteMiddleware: (middleware: Middleware) => middleware,
    useAppConfig: () => ({ defaultCountry: 'pl' }),
    useCountry: () => ({ countryCode: savedCountryCode, setCountry }),
    useNuxtApp: () => ({ $i18n: { setLocale } }),
    useCountries: async () => countries,
    navigateTo,
    getCountryFromCountryCode,
    getLocaleFromCountryCode,
  })

  let middleware: Middleware
  beforeAll(async () => {
    const module = await import('~/middleware/region.global')
    middleware = module.default as unknown as Middleware
  })

  const visit = (fullPath: string) =>
    middleware({ path: fullPath.split('?')[0] ?? fullPath, fullPath })

  beforeEach(() => {
    jest.clearAllMocks()
    countries.value = [country('de'), country('pl')]
    savedCountryCode.value = undefined
  })

  it('takes the country from the URL even when another one was saved', async () => {
    savedCountryCode.value = 'pl'

    await visit('/de/products/shorts')

    expect(setCountry).toHaveBeenCalledWith(country('de'))
    expect(setLocale).toHaveBeenCalledWith('en')
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('sends a URL without a country to the saved one, keeping the path', async () => {
    savedCountryCode.value = 'de'

    expect(await visit('/store?page=2')).toBe('/de/store?page=2')
  })

  it('falls back to the default country', async () => {
    expect(await visit('/')).toBe('/pl/')
  })

  it('ignores a saved country that is no longer a region', async () => {
    savedCountryCode.value = 'fr'

    expect(await visit('/store')).toBe('/pl/store')
  })

  it("doesn't redirect when no countries could be loaded", async () => {
    countries.value = undefined

    expect(await visit('/store')).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
