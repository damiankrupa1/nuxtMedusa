import type {
  StoreAddCartLineItem,
  StoreCompleteCartResponse,
  StoreCart,
  StoreCartShippingMethod,
  StoreUpdateCart,
  StoreUpdateCartLineItem,
} from '@medusajs/types'
import { apiRepository } from './api.repository'

export function cartRepository() {
  const { client, request } = apiRepository()

  return {
    async retrieveCart(cartId: string) {
      return await request(
        client.store.cart.retrieve(cartId, {
          fields:
            '*items,*region,*items.product,*items.variant,*items.thumbnail,*items.metadata,+items.total,*promotions,+shipping_methods.name',
        }),
      )
    },

    async createCart(regionId: string) {
      return await request(
        client.store.cart.create({
          region_id: regionId,
        }),
      )
    },

    async updateCart(
      cartId: string,
      data: StoreUpdateCart,
    ): Promise<StoreCart | null> {
      const cartResponse = await request(client.store.cart.update(cartId, data))
      return cartResponse.cart ?? null
    },

    async createLineItem(
      cartId: string,
      item: StoreAddCartLineItem,
    ): Promise<StoreCart> {
      const cartResponse = await request(
        client.store.cart.createLineItem(cartId, item),
      )
      return cartResponse.cart
    },

    async updateLineItem(
      cartId: string,
      lineItemId: string,
      data: StoreUpdateCartLineItem,
    ): Promise<StoreCart | null> {
      const cartResponse = await request(
        client.store.cart.updateLineItem(cartId, lineItemId, data),
      )
      return cartResponse.cart
    },

    async deleteLineItem(cartId: string, lineItemId: string): Promise<boolean> {
      const cartResponse = await request(
        client.store.cart.deleteLineItem(cartId, lineItemId),
      )
      return cartResponse.deleted
    },

    async addShippingMethod(
      cartId: string,
      shippingMethodId: StoreCartShippingMethod['id'],
    ): Promise<StoreCart> {
      const cartResponse = await request(
        client.store.cart.addShippingMethod(cartId, {
          option_id: shippingMethodId,
        }),
      )
      return cartResponse.cart
    },

    async completeOrder(cartId: string): Promise<StoreCompleteCartResponse> {
      return await request(client.store.cart.complete(cartId))
    },
  }
}
