import type { StoreCart } from '@medusajs/types'

export const providers = [
  {
    id: 'pp_stripe_stripe',
    label: 'Credit card',
    icon: 'i-lucide-credit-card',
  },
  {
    id: 'pp_stripe-blik_stripe',
    label: 'BLIK',
    icon: 'i-lucide-smartphone',
  },
  {
    id: 'pp_stripe-przelewy24_stripe',
    label: 'Przelewy24',
    icon: 'i-lucide-landmark',
  },
  {
    id: 'pp_stripe-ideal_stripe',
    label: 'iDeal',
    icon: 'i-lucide-credit-card',
  },
  {
    id: 'pp_stripe-bancontact_stripe',
    label: 'Bancontact',
    icon: 'i-lucide-credit-card',
  },
  {
    id: 'pp_paypal_paypal',
    label: 'PayPal',
    icon: 'i-lucide-credit-card',
  },
  {
    id: 'pp_system_default',
    label: 'Manual Payment',
    icon: 'i-lucide-hand-coins',
  },
]

/** Stripe methods the review step knows how to confirm. */
export type StripePaymentMethod = 'card' | 'blik' | 'p24'

/**
 * Medusa registers the Stripe card provider as `pp_stripe_<id>` and every
 * other Stripe method as `pp_stripe-<method>_<id>`, so matching on "stripe"
 * alone can't tell them apart.
 */
export function getStripePaymentMethod(
  providerId?: string,
): StripePaymentMethod | undefined {
  if (providerId?.startsWith('pp_stripe_')) return 'card'
  if (providerId?.startsWith('pp_stripe-blik_')) return 'blik'
  if (providerId?.startsWith('pp_stripe-przelewy24_')) return 'p24'
  return undefined
}

/** Billing details Stripe attaches to the payment, from the cart. */
export function toStripeBillingDetails({
  email,
  billing_address: address,
}: Pick<StoreCart, 'email' | 'billing_address'>) {
  return {
    name: address?.first_name || '',
    email: email || '',
    phone: address?.phone || '',
    address: {
      city: address?.city || '',
      country: address?.country_code || '',
      line1: address?.address_1 || '',
      line2: address?.address_2 || '',
      postal_code: address?.postal_code || '',
    },
  }
}
