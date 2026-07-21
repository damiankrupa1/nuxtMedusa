import type { StoreOrder } from '@medusajs/types'
import { orderRepository } from '../repository/order.repository'

export const useFetchOrder = (orderId: string) => {
  const { retrieveOrder } = orderRepository()

  return useLazyAsyncData<StoreOrder>(
    `order:${orderId}`,
    async () =>
      await retrieveOrder(orderId, {
        fields:
          '*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product',
      }),
  )
}
