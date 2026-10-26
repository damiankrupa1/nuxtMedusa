import type { StoreCartResponse, StorePaymentCollection } from '@medusajs/types'
import type { StripeCardElement } from '@stripe/stripe-js'
import { usePaymentService } from '~/services/payment.service'

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback

export const useFetchShippingOptions = () => {
  const medusa = useMedusaClient()
  const { cartId } = useUserCart()

  return useLazyAsyncData(`shipping-options`, async () => {
    if (!cartId.value) {
      return null
    }

    return await medusa.store.fulfillment.listCartOptions({
      cart_id: cartId.value,
    })
  })
}

export const useFetchPaymentProviders = () => {
  const { country } = useCountry()
  const { getPaymentProviders } = usePaymentService()

  return useLazyAsyncData(`payment-providers`, async () => {
    if (!country.value?.region_id) {
      return null
    }

    return await getPaymentProviders({
      region_id: country.value.region_id,
    })
  })
}

export const useInitiatePaymentSession = () => {
  const { createPaymentSession } = usePaymentService()
  const { data: cartResponse } = useNuxtData<StoreCartResponse>('cart')

  const loading = ref(false)
  const data = ref<StorePaymentCollection>()

  const mutate = async (provider_id: string) => {
    loading.value = true

    try {
      if (!cartResponse.value?.cart) {
        throw new Error(
          'No existing cart found, please create one before updating',
        )
      }

      data.value = await createPaymentSession(
        cartResponse.value.cart,
        provider_id,
      )
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    mutate,
  }
}

/**
 * Pays for the cart with its pending payment session's method, then places
 * the order. Card, BLIK and Przelewy24 go through Stripe first.
 */
export const useCartPayment = () => {
  const { createCardElement, payWithStripe, getRedirectedPaymentOutcome } =
    usePaymentService()
  const { mutate: placeOrder } = usePlaceOrder()
  const { data: cartResponse } = useNuxtData<StoreCartResponse>('cart')
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const cardContainer = ref<HTMLElement | null>(null)
  const cardComplete = ref(false)
  // TODO: cardError/paidPaymentIntentId/cardElement/stripeMethod use
  // `undefined` for "no value yet" right next to error/cardContainer above
  // using `null` for the same thing — normalize on `null` here (see the
  // null-vs-undefined convention in the nuxt-vue-architecture skill and
  // https://github.com/damiankrupa1/nuxtMedusa/issues/21).
  const cardError = ref<string>()
  const blikCode = ref('')
  // Set once Stripe took the payment, so retrying an order that failed
  // afterwards places it without paying again
  const paidPaymentIntentId = ref<string>()
  let cardElement: StripeCardElement | undefined

  const cart = computed(() => cartResponse.value?.cart)
  const session = computed(() =>
    cart.value?.payment_collection?.payment_sessions?.find(
      (paymentSession) => paymentSession.status === 'pending',
    ),
  )

  const stripeMethod = computed(() => {
    const data = session.value?.data
    if (!data?.client_secret || data.id === paidPaymentIntentId.value) {
      return undefined
    }
    return getStripePaymentMethod(session.value?.provider_id)
  })

  const ready = computed(
    () =>
      !!cart.value?.shipping_address &&
      !!cart.value.billing_address &&
      !!cart.value.email &&
      !!cart.value.shipping_methods?.length &&
      !!session.value,
  )

  const disabled = computed(
    () =>
      loading.value ||
      !ready.value ||
      (stripeMethod.value === 'card' &&
        (!cardComplete.value || !!cardError.value)) ||
      (stripeMethod.value === 'blik' && !/^\d{6}$/.test(blikCode.value)),
  )

  const run = async (attempt: () => Promise<void>) => {
    loading.value = true
    error.value = null

    try {
      await attempt()
    } catch (err) {
      error.value = getErrorMessage(err, t('checkout.review.genericError'))
    } finally {
      loading.value = false
    }
  }

  const mutate = () =>
    run(async () => {
      const currentCart = cart.value
      const currentSession = session.value
      if (!currentCart || !currentSession) return

      if (stripeMethod.value) {
        const outcome = await payWithStripe(currentCart, currentSession, {
          card: cardElement,
          blikCode: blikCode.value,
        }).finally(() => {
          // A BLIK code works only once, so a retry needs a new one
          blikCode.value = ''
        })

        if (outcome === 'redirected') return
        if (outcome === 'unpaid') {
          throw new Error(t('checkout.review.paymentNotCompleted'))
        }
        paidPaymentIntentId.value = currentSession.data.id as string
      }

      await placeOrder()
    })

  const mountCardElement = async () => {
    if (stripeMethod.value !== 'card' || !session.value) return

    try {
      const card = await createCardElement(session.value)
      card.on('change', (event) => {
        cardComplete.value = event.complete
        cardError.value = event.error?.message
      })
      if (cardContainer.value) {
        card.mount(cardContainer.value)
      }
      cardElement = card
    } catch {
      // stripeRepository reports it; the customer only needs to know it failed
      error.value = t('checkout.review.initFormFailed')
    }
  }

  // Przelewy24 sends the customer back to the review step with the
  // PaymentIntent in the query
  const completeRedirectedPayment = async () => {
    const paymentIntentId = route.query.payment_intent
    if (typeof paymentIntentId !== 'string') return

    const query = { ...route.query }
    delete query.payment_intent
    delete query.payment_intent_client_secret
    delete query.redirect_status
    // Drop Stripe's params so a page refresh doesn't check the payment again
    await router.replace({ query })

    await run(async () => {
      if (!cart.value) return

      const outcome = await getRedirectedPaymentOutcome(
        cart.value,
        paymentIntentId,
      )
      if (!outcome) return
      if (outcome === 'unpaid') {
        throw new Error(t('checkout.review.paymentNotCompleted'))
      }

      paidPaymentIntentId.value = paymentIntentId
      await placeOrder()
    })
  }

  onMounted(async () => {
    await mountCardElement()
    await completeRedirectedPayment()
  })

  onUnmounted(() => {
    cardElement?.destroy()
  })

  return {
    stripeMethod,
    cardContainer,
    cardComplete,
    cardError,
    blikCode,
    loading,
    error,
    disabled,
    mutate,
  }
}
