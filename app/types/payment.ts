export interface PaymentProviderData {
  id: string
  label: string
  icon: string
}

/** Stripe methods the review step knows how to confirm. */
export type StripePaymentMethod = 'card' | 'blik' | 'p24'

/**
 * `paid` once Stripe has the payment, `redirected` while the customer pays
 * with Przelewy24, `unpaid` when Stripe finished without it (e.g. a BLIK
 * payment that wasn't approved).
 */
export type StripePaymentOutcome = 'paid' | 'unpaid' | 'redirected'
