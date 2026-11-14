import { describe, expect, it } from 'vitest'

import { buildAddressSchema } from '~/types/checkout'

describe('checkout address schema', () => {
  const schema = buildAddressSchema((key) => key)
  const valid = {
    shipping_address: {
      first_name: 'Jan',
      last_name: 'Kowalski',
      address_1: 'Prosta 1',
      postal_code: '00-001',
      city: 'Warszawa',
      country_code: 'pl',
    },
    email: 'jan@example.com',
    billing_address: {},
  }

  it('accepts an address with only the required fields', () => {
    expect(schema.safeParse(valid).success).toBe(true)
  })

  it('rejects an empty required shipping field', () => {
    const result = schema.safeParse({
      ...valid,
      shipping_address: { ...valid.shipping_address, city: '' },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['shipping_address', 'city'])
    expect(result.error?.issues[0]?.message).toBe('validation.cityRequired')
  })

  it.each([
    ['first_name', 'validation.firstNameRequired'],
    ['last_name', 'validation.lastNameRequired'],
    ['address_1', 'validation.addressRequired'],
    ['postal_code', 'validation.postalCodeRequired'],
    ['city', 'validation.cityRequired'],
    ['country_code', 'validation.countryRequired'],
  ])('reports a missing shipping %s with its own message', (field, message) => {
    const result = schema.safeParse({
      ...valid,
      shipping_address: { ...valid.shipping_address, [field]: undefined },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['shipping_address', field])
    expect(result.error?.issues[0]?.message).toBe(message)
  })

  it('reports a missing email as required, not as invalid', () => {
    const result = schema.safeParse({ ...valid, email: undefined })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('validation.emailRequired')
  })

  it('rejects an invalid email', () => {
    const result = schema.safeParse({ ...valid, email: 'a@' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['email'])
    expect(result.error?.issues[0]?.message).toBe('validation.emailInvalid')
  })

  it('does not require any billing field', () => {
    const result = schema.safeParse({
      ...valid,
      billing_address: { city: undefined },
    })

    expect(result.success).toBe(true)
  })
})
