import { describe, expect, it } from 'vitest'

import { convertToLocale } from '~/utils/price'

describe('price utils', () => {
  it('formats a price using the mapped locale', () => {
    expect(
      convertToLocale({
        amount: 100,
        currency_code: 'USD',
        country: 'us',
      }),
    ).toBe('$100.00')
  })

  it('returns a formatted string when country is unknown', () => {
    const formatted = convertToLocale({
      amount: 100,
      currency_code: 'EUR',
      country: 'xx',
    })

    expect(formatted).toContain('100')
    expect(formatted).toContain('€')
  })
})
