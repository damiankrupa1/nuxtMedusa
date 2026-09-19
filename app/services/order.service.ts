import { orderRepository } from '../repository/order.repository'

// TODO: unused (composables call orderRepository directly) — remove if no logic is added here

export const useOrderService = () => {
  const { retrieveOrder } = orderRepository()

  const getOrder = async (orderId: string, query?: Record<string, unknown>) => {
    return await retrieveOrder(orderId, query)
  }

  return {
    getOrder,
  }
}
