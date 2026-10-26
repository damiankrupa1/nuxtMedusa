import type { PaymentMethodCreateParams } from '@stripe/stripe-js'

/** Przelewy24 requires the email, the other methods take it as well. */
export type StripeBillingDetails = PaymentMethodCreateParams.BillingDetails & {
  email: string
}
