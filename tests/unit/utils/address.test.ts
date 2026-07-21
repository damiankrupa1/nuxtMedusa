import { describe, expect, it } from '@jest/globals'
import type { StoreCartAddress } from '@medusajs/types'
import { compareAddresses } from '../../../app/utils/address'

describe('address utils', () => {
  const makeAddress = (
    overrides: Partial<StoreCartAddress> = {},
  ): StoreCartAddress =>
    ({
      first_name: 'Jane',
      last_name: 'Doe',
      address_1: '123 Main St',
      company: undefined,
      postal_code: '10001',
      city: 'New York',
      country_code: 'us',
      province: 'NY',
      phone: '5551234567',
      ...overrides,
    }) as StoreCartAddress

  it('returns true when the relevant address fields match', () => {
    const addressA = makeAddress()
    const addressB = makeAddress()

    expect(compareAddresses(addressA, addressB)).toBe(true)
  })

  it('returns false when a relevant address field differs', () => {
    const addressA = makeAddress()
    const addressB = makeAddress({ postal_code: '10002' })

    expect(compareAddresses(addressA, addressB)).toBe(false)
  })

  it('treats the company field as part of the comparison', () => {
    const addressA = makeAddress({ company: 'Acme' })
    const addressB = makeAddress({ company: 'Other' })

    expect(compareAddresses(addressA, addressB)).toBe(false)
  })
})
