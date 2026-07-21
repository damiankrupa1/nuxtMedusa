import type { StoreRegion, StoreRegionCountry } from '@medusajs/types'
import { describe, expect, it } from '@jest/globals'

import {
  getCountriesFromRegions,
  getCountryFromCountryCode,
} from '../../../app/utils/country'

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
