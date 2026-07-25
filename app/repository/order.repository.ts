import type { StoreOrder } from '@medusajs/types'
import { apiRepository } from './api.repository'

export function orderRepository() {
  const { client, request } = apiRepository()

  return {
    async retrieveOrder(
      orderId: string,
      query?: Record<string, unknown>,
    ): Promise<StoreOrder> {
      const response = await request(
        client.store.order.retrieve(orderId, query),
      )
      return response.order
    },
  }
}
