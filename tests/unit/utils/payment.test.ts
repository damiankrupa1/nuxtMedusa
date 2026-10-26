import { describe, expect, it } from '@jest/globals'
import {
  getStripePaymentMethod,
  providers,
  toStripeBillingDetails,
} from '~/utils/payment'

describe('payment utils', () => {
  it('contains the expected payment provider labels', () => {
    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'pp_stripe_stripe',
          label: 'Credit card',
        }),
        expect.objectContaining({ id: 'pp_stripe-blik_stripe', label: 'BLIK' }),
        expect.objectContaining({
          id: 'pp_stripe-przelewy24_stripe',
          label: 'Przelewy24',
        }),
        expect.objectContaining({ id: 'pp_paypal_paypal', label: 'PayPal' }),
        expect.objectContaining({
          id: 'pp_system_default',
          label: 'Manual Payment',
        }),
      ]),
    )
  })

  it('exposes a stable provider list shape', () => {
    expect(providers).toHaveLength(7)
    expect(providers.every((provider) => provider.id && provider.label)).toBe(
      true,
    )
  })

  it('tells the Stripe card provider apart from other Stripe methods', () => {
    expect(getStripePaymentMethod('pp_stripe_stripe')).toBe('card')
    expect(getStripePaymentMethod('pp_stripe-blik_stripe')).toBe('blik')
    expect(getStripePaymentMethod('pp_stripe-przelewy24_stripe')).toBe('p24')
  })

  it('ignores providers the review step cannot confirm', () => {
    expect(getStripePaymentMethod('pp_stripe-ideal_stripe')).toBeUndefined()
    expect(getStripePaymentMethod('pp_system_default')).toBeUndefined()
    expect(getStripePaymentMethod(undefined)).toBeUndefined()
  })

  it('builds Stripe billing details from the cart', () => {
    expect(
      toStripeBillingDetails({
        email: 'jan@example.com',
        billing_address: {
          id: 'caaddr_1',
          first_name: 'Jan',
          phone: '+48 600 100 200',
          address_1: 'Długa 12',
          city: 'Kraków',
          country_code: 'pl',
          postal_code: '30-001',
          created_at: '2026-10-17',
          updated_at: '2026-10-17',
        },
      }),
    ).toEqual({
      name: 'Jan',
      email: 'jan@example.com',
      phone: '+48 600 100 200',
      address: {
        city: 'Kraków',
        country: 'pl',
        line1: 'Długa 12',
        line2: '',
        postal_code: '30-001',
      },
    })
  })

  it('leaves missing billing details empty', () => {
    expect(toStripeBillingDetails({})).toEqual({
      name: '',
      email: '',
      phone: '',
      address: { city: '', country: '', line1: '', line2: '', postal_code: '' },
    })
  })
})
