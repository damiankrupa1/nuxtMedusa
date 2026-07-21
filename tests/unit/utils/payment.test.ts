import { describe, expect, it } from '@jest/globals'
import { providers } from '../../../app/utils/payment'

describe('payment utils', () => {
  it('contains the expected payment provider labels', () => {
    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'pp_stripe_stripe',
          label: 'Credit card',
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
    expect(providers).toHaveLength(5)
    expect(providers.every((provider) => provider.id && provider.label)).toBe(
      true,
    )
  })
})
