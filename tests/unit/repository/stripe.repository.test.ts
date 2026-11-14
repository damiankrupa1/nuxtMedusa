import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe, StripeCardElement } from '@stripe/stripe-js'

import { stripeRepository } from '~/repository/stripe.repository'

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn() }))

describe('stripe repository', () => {
  const stripe = {
    confirmCardPayment:
      vi.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>(),
  }
  const config = { public: { stripeKey: 'pk_test' } }
  const captureError = vi.fn()
  const card = {} as StripeCardElement
  const billingDetails = { email: 'jan@example.com' }

  Object.assign(globalThis, {
    useRuntimeConfig: () => config,
    captureError,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    config.public.stripeKey = 'pk_test'
    vi.mocked(loadStripe).mockResolvedValue(stripe as unknown as Stripe)
  })

  it('throws card declines without reporting them', async () => {
    stripe.confirmCardPayment.mockResolvedValue({
      error: {
        type: 'card_error',
        code: 'card_declined',
        message: 'Your card was declined.',
      },
    })

    await expect(
      stripeRepository().confirmCardPayment('pi_secret', card, billingDetails),
    ).rejects.toThrow('Your card was declined.')
    expect(captureError).not.toHaveBeenCalled()
  })

  it('reports the errors that are ours to fix, with Stripe codes', async () => {
    stripe.confirmCardPayment.mockResolvedValue({
      error: {
        type: 'invalid_request_error',
        code: 'resource_missing',
        message: 'No such payment_intent',
      },
    })

    await expect(
      stripeRepository().confirmCardPayment('pi_secret', card, billingDetails),
    ).rejects.toThrow('No such payment_intent')
    expect(captureError).toHaveBeenCalledWith(expect.any(Error), {
      source: 'stripe',
      type: 'invalid_request_error',
      code: 'resource_missing',
      declineCode: undefined,
    })
  })

  it('reports a missing Stripe key', async () => {
    config.public.stripeKey = ''

    await expect(
      stripeRepository().createCardElement('pi_secret'),
    ).rejects.toThrow('Stripe key is not set')
    expect(captureError).toHaveBeenCalledWith(expect.any(Error), {
      source: 'stripe',
    })
  })

  it('loads Stripe.js once per repository', async () => {
    stripe.confirmCardPayment.mockResolvedValue({ paymentIntent: {} })
    const repository = stripeRepository()

    await repository.confirmCardPayment('pi_secret', card, billingDetails)
    await repository.confirmCardPayment('pi_secret', card, billingDetails)

    expect(loadStripe).toHaveBeenCalledTimes(1)
  })
})
