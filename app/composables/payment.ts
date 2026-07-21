import type { StoreCartResponse, StorePaymentCollection } from '@medusajs/types'
import { paymentRepository } from '../repository/payment.repository'

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
  const { listPaymentProviders } = paymentRepository()

  return useLazyAsyncData(`payment-providers`, async () => {
    if (!country.value?.region_id) {
      return null
    }

    return await listPaymentProviders({
      region_id: country.value.region_id,
    })
  })
}

export const usePaymentSession = () => {
  const { initiatePaymentSession } = paymentRepository()
  const { data: cartResponse } = useNuxtData<StoreCartResponse>('cart')

  const initiatePaymentSessionWithProvider = async (provider_id: string) => {
    if (!cartResponse.value?.cart) {
      throw new Error(
        'No existing cart found, please create one before updating',
      )
    }

    const paymentCollection = await initiatePaymentSession(
      cartResponse.value.cart,
      provider_id,
    )

    await refreshNuxtData('cart')
    return paymentCollection
  }

  return {
    initiatePaymentSession: initiatePaymentSessionWithProvider,
  }
}

export const useInitiatePaymentSession = () => {
  const { initiatePaymentSession } = usePaymentSession()

  const loading = ref(false)
  const data = ref<StorePaymentCollection>()

  const mutate = async (provider_id: string) => {
    loading.value = true

    try {
      data.value = await initiatePaymentSession(provider_id)
    } catch (error) {
      console.error('Error initiating payment session:', error)
      throw error
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
