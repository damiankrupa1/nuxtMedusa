import { defineComponent, h, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useCookie, useNuxtApp, useState } from 'nuxt/app'

import regionMiddleware from '~/middleware/region.global'

const mocks = vi.hoisted(() => ({
  countries: undefined as Array<{ iso_2: string; region_id: string }> | undefined,
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
        selectedCountry = useState<{ iso_2: string } | null>('country').value?.iso_2
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

  it('does not redirect when countries are unavailable', async () => {
    mocks.countries = undefined

    const { result, wrapper } = await runMiddleware('/store')

    expect(result).toBeUndefined()
    expect(wrapper.text()).toBe('continued')
    expect(mocks.navigateTo).not.toHaveBeenCalled()
  })
})
