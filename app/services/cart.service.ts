import type {
  StoreAddCartLineItem,
  StoreCartShippingOption,
  StoreUpdateCart,
  StoreUpdateCartLineItem,
} from '@medusajs/types'
import { cartRepository } from '~/repository/cart.repository'

export const useCartService = () => {
  const { cartId, setCartId } = useUserCart()
  const { country } = useCountry()
  const {
    retrieveCart: repositoryRetrieveCart,
    createCart: repositoryCreateCart,
    updateCart: repositoryUpdateCart,
    createLineItem: repositoryCreateLineItem,
    updateLineItem: repositoryUpdateLineItem,
    deleteLineItem: repositoryDeleteLineItem,
    addShippingMethod: repositoryAddShippingMethod,
    completeOrder: repositoryCompleteOrder,
  } = cartRepository()

  const retrieveCart = async () => {
    if (!cartId.value) return { cart: null }

    const cartResponse = await repositoryRetrieveCart(cartId.value)

    if (
      cartResponse.cart &&
      cartResponse.cart?.region_id !== country.value?.region_id
    ) {
      void updateCart({ region_id: country.value?.region_id })
    }

    return cartResponse
  }

  const createCart = async () => {
    if (!country.value?.region_id) {
      throw new Error('No region selected, cannot create cart')
    }

    const cartResponse = await repositoryCreateCart(country.value.region_id)
    setCartId(cartResponse.cart.id)
    return cartResponse
  }

  const retrieveOrCreateCart = async () => {
    const cartResponse = await retrieveCart()
    if (!cartResponse.cart) return await createCart()
    return cartResponse
  }

  const updateCart = async (data: StoreUpdateCart) => {
    if (!cartId.value)
      throw new Error(
        'No existing cart found, please create one before updating',
      )

    const cart = await repositoryUpdateCart(cartId.value, data)
    void refreshNuxtData(`cart`)
    return cart
  }

  const createLineItem = async (item: StoreAddCartLineItem) => {
    if (!cartId.value)
      throw new Error(
        'No existing cart found, please create one before updating',
      )

    const cart = await repositoryCreateLineItem(cartId.value, item)
    void refreshNuxtData(`cart`)
    return cart
  }

  const updateLineItem = async (
    lineItemId: string,
    data: StoreUpdateCartLineItem,
  ) => {
    if (!cartId.value)
      throw new Error(
        'No existing cart found, please create one before updating',
      )

    const cart = await repositoryUpdateLineItem(cartId.value, lineItemId, data)
    void refreshNuxtData(`cart`)
    return cart
  }

  const updateOrCreateLineItem = async (item: StoreAddCartLineItem) => {
    const cartResponse = await retrieveOrCreateCart()
    if (!cartResponse.cart)
      throw new Error(
        'No existing cart found, please create one before adding items',
      )

    const existingItem = cartResponse.cart.items?.find(
      (lineItem) => lineItem.variant_id === item.variant_id,
    )

    if (existingItem) {
      const updatedQuantity = existingItem.quantity + (item.quantity || 1)
      return await updateLineItem(existingItem.id, {
        quantity: updatedQuantity,
      })
    } else {
      return await createLineItem(item)
    }
  }

  const deleteLineItem = async (lineItemId: string) => {
    if (!cartId.value)
      throw new Error(
        'No existing cart found, please create one before updating',
      )

    const deleted = await repositoryDeleteLineItem(cartId.value, lineItemId)
    void refreshNuxtData(`cart`)
    return deleted
  }

  const addShippingMethod = async (
    optionId: StoreCartShippingOption['id'],
    data?: Record<string, unknown>,
  ) => {
    if (!cartId.value)
      throw new Error(
        'No existing cart found, please create one before updating',
      )

    const cart = await repositoryAddShippingMethod(cartId.value, optionId, data)
    void refreshNuxtData(`cart`)
    return cart
  }

  const completeOrder = async () => {
    if (!cartId.value) throw new Error('No existing cart found')

    return await repositoryCompleteOrder(cartId.value)
  }

  return {
    retrieveCart,
    createCart,
    retrieveOrCreateCart,
    updateCart,
    createLineItem,
    updateLineItem,
    updateOrCreateLineItem,
    deleteLineItem,
    addShippingMethod,
    completeOrder,
  }
}
