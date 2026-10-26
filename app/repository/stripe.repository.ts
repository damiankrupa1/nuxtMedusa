import { loadStripe } from '@stripe/stripe-js'
import type {
  PaymentIntent,
  PaymentIntentResult,
  Stripe,
  StripeCardElement,
} from '@stripe/stripe-js'
import type { StripeBillingDetails } from '~/types/stripe'

// Declines and invalid card details are the customer's to fix, not ours
const CUSTOMER_ERROR_TYPES = ['card_error', 'validation_error']

export function stripeRepository() {
  const config = useRuntimeConfig()
  // Elements must be confirmed with the Stripe instance that created them
  let stripePromise: Promise<Stripe | null> | undefined

  async function getStripe(): Promise<Stripe> {
    if (!config.public.stripeKey) {
      throw new Error('Stripe key is not set')
    }

    stripePromise ??= loadStripe(config.public.stripeKey)
    const stripe = await stripePromise
    if (!stripe) {
      throw new Error('Failed to initialize Stripe')
    }
    return stripe
  }

  // Failing to load or call Stripe.js is always ours to fix
  async function withStripe<T>(
    call: (stripe: Stripe) => T | Promise<T>,
  ): Promise<T> {
    try {
      return await call(await getStripe())
    } catch (error) {
      captureError(error, { source: 'stripe' })
      throw error
    }
  }

  // Stripe.js reports payment failures in the result instead of rejecting
  async function request(
    call: (stripe: Stripe) => Promise<PaymentIntentResult>,
  ): Promise<PaymentIntent> {
    const result = await withStripe(call)
    if (result.error) {
      const { type, code, decline_code: declineCode, message } = result.error
      const error = new Error(message)
      if (!CUSTOMER_ERROR_TYPES.includes(type)) {
        captureError(error, { source: 'stripe', type, code, declineCode })
      }
      throw error
    }
    return result.paymentIntent
  }

  return {
    async createCardElement(clientSecret: string): Promise<StripeCardElement> {
      return await withStripe((stripe) =>
        stripe.elements({ clientSecret }).create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#c23d4b',
            },
          },
        }),
      )
    },

    async confirmCardPayment(
      clientSecret: string,
      card: StripeCardElement,
      billingDetails: StripeBillingDetails,
    ): Promise<PaymentIntent> {
      return await request((stripe) =>
        stripe.confirmCardPayment(clientSecret, {
          payment_method: { card, billing_details: billingDetails },
        }),
      )
    },

    // Resolves once the customer approves or rejects the payment in their
    // banking app, which they have 60 seconds for
    async confirmBlikPayment(
      clientSecret: string,
      code: string,
      billingDetails: StripeBillingDetails,
    ): Promise<PaymentIntent> {
      return await request((stripe) =>
        stripe.confirmBlikPayment(clientSecret, {
          payment_method: { blik: {}, billing_details: billingDetails },
          payment_method_options: { blik: { code } },
        }),
      )
    },

    // Redirects the customer to Przelewy24, which sends them back to returnUrl
    async confirmP24Payment(
      clientSecret: string,
      billingDetails: StripeBillingDetails,
      returnUrl: string,
    ): Promise<PaymentIntent> {
      return await request((stripe) =>
        stripe.confirmP24Payment(clientSecret, {
          payment_method: { billing_details: billingDetails },
          return_url: returnUrl,
        }),
      )
    },

    async retrievePaymentIntent(clientSecret: string): Promise<PaymentIntent> {
      return await request((stripe) =>
        stripe.retrievePaymentIntent(clientSecret),
      )
    },
  }
}
