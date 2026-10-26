import type {
  StoreCart,
  StorePaymentCollection,
  StorePaymentProviderFilters,
  StorePaymentSession,
} from '@medusajs/types'
import type { StripeCardElement } from '@stripe/stripe-js'
import { paymentRepository } from '../repository/payment.repository'
import { stripeRepository } from '../repository/stripe.repository'

/**
 * `paid` once Stripe has the payment, `redirected` while the customer pays
 * with Przelewy24, `unpaid` when Stripe finished without it (e.g. a BLIK
 * payment that wasn't approved).
 */
export type StripePaymentOutcome = 'paid' | 'unpaid' | 'redirected'

export const usePaymentService = () => {
  const { listPaymentProviders, initiatePaymentSession } = paymentRepository()
  const {
    createCardElement: repositoryCreateCardElement,
    confirmCardPayment,
    confirmBlikPayment,
    confirmP24Payment,
    retrievePaymentIntent,
  } = stripeRepository()

  // Medusa keeps Stripe's PaymentIntent as the session data
  const getClientSecret = (session: StorePaymentSession) =>
    session.data.client_secret as string

  const getPaymentProviders = async (query: StorePaymentProviderFilters) => {
    return await listPaymentProviders(query)
  }

  const createPaymentSession = async (
    cart: StoreCart,
    provider_id: string,
  ): Promise<StorePaymentCollection> => {
    const paymentCollection = await initiatePaymentSession(cart, provider_id)
    await refreshNuxtData('cart')
    return paymentCollection
  }

  const createCardElement = async (session: StorePaymentSession) => {
    return await repositoryCreateCardElement(getClientSecret(session))
  }

  const payWithStripe = async (
    cart: StoreCart,
    session: StorePaymentSession,
    {
      card,
      blikCode = '',
    }: { card?: StripeCardElement | null; blikCode?: string },
  ): Promise<StripePaymentOutcome> => {
    const clientSecret = getClientSecret(session)
    const billingDetails = toStripeBillingDetails(cart)

    switch (getStripePaymentMethod(session.provider_id)) {
      case 'card': {
        if (!card) {
          throw new Error('Stripe payment elements are not fully initialized')
        }
        await confirmCardPayment(clientSecret, card, billingDetails)
        return 'paid'
      }
      case 'blik': {
        const paymentIntent = await confirmBlikPayment(
          clientSecret,
          blikCode,
          billingDetails,
        )
        return paymentIntent.status === 'succeeded' ? 'paid' : 'unpaid'
      }
      case 'p24':
        await confirmP24Payment(
          clientSecret,
          billingDetails,
          window.location.href,
        )
        return 'redirected'
      default:
        throw new Error(`Unsupported Stripe provider: ${session.provider_id}`)
    }
  }

  /**
   * Outcome of the payment Przelewy24 redirected back from, or null
   * when it isn't one of the cart's. Matched by PaymentIntent rather than
   * status: Stripe's webhook may have completed the cart, and authorized the
   * session, before the customer is back.
   */
  const getRedirectedPaymentOutcome = async (
    cart: StoreCart,
    paymentIntentId: string,
  ): Promise<StripePaymentOutcome | null> => {
    const session = cart.payment_collection?.payment_sessions?.find(
      (paymentSession) => paymentSession.data?.id === paymentIntentId,
    )
    if (!session) return null

    const paymentIntent = await retrievePaymentIntent(getClientSecret(session))
    return paymentIntent.status === 'succeeded' ? 'paid' : 'unpaid'
  }

  return {
    getPaymentProviders,
    createPaymentSession,
    createCardElement,
    payWithStripe,
    getRedirectedPaymentOutcome,
  }
}
