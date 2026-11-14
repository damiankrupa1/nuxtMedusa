import type { StoreRegion, StoreRegionCountry } from '@medusajs/types'
import { describe, expect, it } from 'vitest'

import {
  getCountriesFromRegions,
  getCountryFromCountryCode,
  getCountryFromCountryCodeIgnoreCase,
  getCountryRedirectPath,
} from '~/utils/country'

describe('country utils', () => {
  const makeCountry = (
    iso_2: string,
    name: string,
    region_id: string,
  ): StoreRegionCountry & { region_id: string } =>
    ({
      iso_2,
      name,
      display_name: name,
      region_id,
    }) as StoreRegionCountry & { region_id: string }

  it('finds a country by iso_2 code', () => {
    const countries = [
      makeCountry('us', 'United States', 'region-1'),
      makeCountry('fr', 'France', 'region-2'),
    ]

    expect(getCountryFromCountryCode(countries, 'fr')).toEqual(countries[1])
    expect(getCountryFromCountryCode(countries, 'xx')).toBeUndefined()
    expect(getCountryFromCountryCode(countries, undefined)).toBeUndefined()
  })

  it('finds a country by iso_2 code in any case', () => {
    const countries = [
      makeCountry('us', 'United States', 'region-1'),
      makeCountry('FR', 'France', 'region-2'),
    ]

    expect(getCountryFromCountryCodeIgnoreCase(countries, 'US')).toEqual(
      countries[0],
    )
    expect(getCountryFromCountryCodeIgnoreCase(countries, 'fr')).toEqual(
      countries[1],
    )
    expect(getCountryFromCountryCodeIgnoreCase(countries, 'xx')).toBeUndefined()
    expect(getCountryFromCountryCodeIgnoreCase(countries, '')).toBeUndefined()
    expect(getCountryFromCountryCodeIgnoreCase(undefined, 'us')).toBeUndefined()
  })

  describe('getCountryRedirectPath', () => {
    it('replaces a first segment of two ASCII letters in any case', () => {
      expect(getCountryRedirectPath('/xx/store', 'pl')).toBe('/pl/store')
      expect(getCountryRedirectPath('/XX/store', 'pl')).toBe('/pl/store')
      expect(getCountryRedirectPath('/xx', 'pl')).toBe('/pl')
      expect(getCountryRedirectPath('/xx/', 'pl')).toBe('/pl/')
      expect(getCountryRedirectPath('/xx?x=1#h', 'pl')).toBe('/pl?x=1#h')
      expect(getCountryRedirectPath('/xx#h', 'pl')).toBe('/pl#h')
      expect(getCountryRedirectPath('/xx/store?x=1#h', 'pl')).toBe(
        '/pl/store?x=1#h',
      )
    })

    it('replaces only the first segment', () => {
      expect(getCountryRedirectPath('/xx/yy/store', 'pl')).toBe('/pl/yy/store')
    })

    it('prefixes everything else', () => {
      expect(getCountryRedirectPath('/', 'pl')).toBe('/pl/')
      expect(getCountryRedirectPath('/store?page=2', 'pl')).toBe(
        '/pl/store?page=2',
      )
      expect(getCountryRedirectPath('/xxx/store', 'pl')).toBe('/pl/xxx/store')
      expect(getCountryRedirectPath('/x/store', 'pl')).toBe('/pl/x/store')
      expect(getCountryRedirectPath('/pl-PL/store', 'pl')).toBe(
        '/pl/pl-PL/store',
      )
      expect(getCountryRedirectPath('/x1/store', 'pl')).toBe('/pl/x1/store')
      expect(getCountryRedirectPath('/ął/store', 'pl')).toBe('/pl/ął/store')
      expect(getCountryRedirectPath('/store/xx', 'pl')).toBe('/pl/store/xx')
    })
  })

  it('flattens and sorts countries from regions by name', () => {
    const regions = [
      {
        countries: [
          makeCountry('us', 'United States', 'region-1'),
          makeCountry('fr', 'France', 'region-2'),
        ],
      },
      {
        countries: [makeCountry('de', 'Germany', 'region-3')],
      },
    ] as unknown as StoreRegion[]

    expect(getCountriesFromRegions(regions)).toEqual([
      makeCountry('fr', 'France', 'region-2'),
      makeCountry('de', 'Germany', 'region-3'),
      makeCountry('us', 'United States', 'region-1'),
    ])
  })

  it('returns an empty list when regions are missing', () => {
    expect(getCountriesFromRegions(undefined)).toEqual([])
  })

  it('ignores countries without a name when flattening regions', () => {
    const regions = [
      {
        countries: [
          makeCountry('us', 'United States', 'region-1'),
          { iso_2: 'fr', display_name: 'France', region_id: 'region-2' },
        ],
      },
    ] as unknown as StoreRegion[]

    expect(getCountriesFromRegions(regions)).toEqual([
      makeCountry('us', 'United States', 'region-1'),
    ])
  })
})
