import type {
  StoreCart,
  StorePaymentCollection,
  StorePaymentProviderFilters,
} from '@medusajs/types'
import { paymentRepository } from '../repository/payment.repository'

export const usePaymentService = () => {
  const { listPaymentProviders, initiatePaymentSession } = paymentRepository()

  const getPaymentProviders = async (query: StorePaymentProviderFilters) => {
    return await listPaymentProviders(query)
  }

  const createPaymentSession = async (
    cartResponse: StoreCart,
    provider_id: string,
  ): Promise<StorePaymentCollection> => {
    return await initiatePaymentSession(cartResponse, provider_id)
  }

  return {
    getPaymentProviders,
    createPaymentSession,
  }
}
