import type {
  StoreCartResponse,
  StorePaymentCollection,
  StorePaymentProviderFilters,
} from '@medusajs/types'
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
      region_id: country.value?.region_id,
    })
  })
}

export const usePaymentSession = () => {
  const { initiatePaymentSession } = paymentRepository()

  const initiatePaymentSessionWithProvider = async (provider_id: string) => {
    const { data: cartResponse } = useNuxtData<StoreCartResponse>('cart')
    if (!cartResponse.value?.cart)
      throw new Error(
        'No existing cart found, please create one before updating',
      )

    const paymentCollection = await initiatePaymentSession(
      cartResponse.value?.cart,
      provider_id,
    )

    await refreshNuxtData(`cart`)
    return paymentCollection
  }

  return {
    initiatePaymentSession: initiatePaymentSessionWithProvider,
  }
}

export const usePaymentService = () => {
  const { listPaymentProviders, initiatePaymentSession } = paymentRepository()

  const getPaymentProviders = async (query: StorePaymentProviderFilters) => {
    return await listPaymentProviders(query)
  }

  const createPaymentSession = async (
    cartResponse: StoreCartResponse['cart'],
    provider_id: string,
  ): Promise<StorePaymentCollection> => {
    return await initiatePaymentSession(cartResponse, provider_id)
  }

  return {
    getPaymentProviders,
    createPaymentSession,
  }
}
