import { describe, expect, it } from '@jest/globals'

import { toCountryLink } from '~/utils/link'

describe('toCountryLink', () => {
  it('prefixes a path with the country code', () => {
    expect(toCountryLink('/store', 'pl')).toBe('/pl/store')
    expect(toCountryLink('/', 'de')).toBe('/de/')
    expect(toCountryLink('/#journal', 'pl')).toBe('/pl/#journal')
  })

  it('adds the country code to a named route', () => {
    expect(
      toCountryLink(
        { name: 'countryCode-products-handle', params: { handle: 'shirt' } },
        'pl',
      ),
    ).toEqual({
      name: 'countryCode-products-handle',
      params: { handle: 'shirt', countryCode: 'pl' },
    })
  })

  it('keeps query and hash of a named route', () => {
    expect(
      toCountryLink(
        { name: 'countryCode-checkout', query: { step: 'address' } },
        'de',
      ),
    ).toEqual({
      name: 'countryCode-checkout',
      params: { countryCode: 'de' },
      query: { step: 'address' },
    })
  })

  it('returns undefined for a named route without a country code', () => {
    expect(
      toCountryLink({ name: 'countryCode-store' }, undefined),
    ).toBeUndefined()
    expect(toCountryLink({ name: 'countryCode-store' }, '')).toBeUndefined()
  })

  it('returns undefined for a named route with a missing param', () => {
    expect(
      toCountryLink(
        {
          name: 'countryCode-products-handle',
          params: { handle: undefined as unknown as string },
        },
        'pl',
      ),
    ).toBeUndefined()
    expect(
      toCountryLink(
        { name: 'countryCode-categories-handle', params: { handle: '' } },
        'pl',
      ),
    ).toBeUndefined()
  })

  it('does not change the route passed in', () => {
    const route = {
      name: 'countryCode-collections-handle',
      params: { handle: 'summer' },
    } as const
    toCountryLink(route, 'pl')
    expect(route.params).toEqual({ handle: 'summer' })
  })
})
