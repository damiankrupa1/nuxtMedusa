import { describe, expect, it } from 'vitest'

import { medusaRegionListResponseSchema } from '~/types/country'
import { medusaRegionListResponse } from '~~/tests/fixtures/medusa'

// The narrow schema of Medusa's regions answer (#84): what the routing and
// the region-scoped calls read, loose, so a field Medusa adds passes

const [poland] = medusaRegionListResponse.regions
const country = poland!.countries[0]!

const withCountry = (change: Record<string, unknown>) => ({
  regions: [{ ...poland, countries: [{ ...country, ...change }] }],
})

const issuesOf = (answer: unknown) =>
  medusaRegionListResponseSchema
    .safeParse(answer)
    .error?.issues.map(({ path, code }) => [path.join('.'), code])

describe('medusaRegionListResponseSchema', () => {
  it("accepts Medusa's recorded regions answer", () => {
    expect(
      medusaRegionListResponseSchema.safeParse(medusaRegionListResponse)
        .success,
    ).toBe(true)
  })

  it('accepts fields Medusa adds, on a country, a region and the answer', () => {
    const answer = {
      regions: [
        {
          ...poland,
          currency_code: 'pln',
          countries: [{ ...country, iso_3: 'pol', num_code: '616' }],
        },
      ],
      count: 1,
      added: true,
    }

    expect(medusaRegionListResponseSchema.parse(answer)).toEqual(answer)
  })

  it('accepts what the SDK type and the storefront allow to be missing', () => {
    const { name: _name, display_name: _display, ...bare } = country

    expect(issuesOf({ regions: [{ ...poland, countries: [bare] }] })).toBe(
      undefined,
    )
    expect(issuesOf({ regions: [{ id: 'reg_1' }] })).toBe(undefined)
    expect(issuesOf({ regions: [] })).toBe(undefined)
  })

  it.each(['iso_2', 'region_id'] as const)(
    'refuses a country without the %s the routing needs',
    (field) => {
      const { [field]: _removed, ...rest } = country

      expect(issuesOf({ regions: [{ ...poland, countries: [rest] }] })).toEqual(
        [[`regions.0.countries.0.${field}`, 'invalid_type']],
      )
    },
  )

  it.each([
    ['an empty iso_2', { iso_2: '' }, 'iso_2', 'too_small'],
    ['an empty region_id', { region_id: '' }, 'region_id', 'too_small'],
    ['an iso_2 of the wrong type', { iso_2: 616 }, 'iso_2', 'invalid_type'],
    ['a name of the wrong type', { name: null }, 'name', 'invalid_type'],
    [
      'a display_name of the wrong type',
      { display_name: 1 },
      'display_name',
      'invalid_type',
    ],
  ])('refuses %s', (_case, change, field, code) => {
    expect(issuesOf(withCountry(change))).toEqual([
      [`regions.0.countries.0.${field}`, code],
    ])
  })

  it('refuses an answer without its regions, or with countries that are no list', () => {
    expect(issuesOf({ count: 0 })).toEqual([['regions', 'invalid_type']])
    expect(issuesOf({ regions: [{ countries: { pl: country } }] })).toEqual([
      ['regions.0.countries', 'invalid_type'],
    ])
  })
})
