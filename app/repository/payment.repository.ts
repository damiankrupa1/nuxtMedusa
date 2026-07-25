import type {
  StoreCart,
  StorePaymentCollection,
  StorePaymentProviderFilters,
} from '@medusajs/types'
import { apiRepository } from './api.repository'

export function paymentRepository() {
  const { client, request } = apiRepository()

  return {
    async listPaymentProviders(query: StorePaymentProviderFilters) {
      return await request(
        client.store.payment.listPaymentProviders({
          ...query,
        }),
      )
    },

    async initiatePaymentSession(
      cart: StoreCart,
      provider_id: string,
    ): Promise<StorePaymentCollection> {
      const response = await request(
        client.store.payment.initiatePaymentSession(cart, {
          provider_id,
        }),
      )
      return response.payment_collection
    },
  }
}
