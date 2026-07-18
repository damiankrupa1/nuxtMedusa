import type {
  StoreAddCartLineItem,
  StoreCartResponse,
  StoreCartShippingMethod,
  StoreOrder,
  StoreProductListParams,
  StoreUpdateCart,
  StoreUpdateCartLineItem,
} from '@medusajs/types'
import { cartRepository } from '../repository/cart.repository'
import { categoryRepository } from '../repository/category.repository'
import { collectionRepository } from '../repository/collection.repository'
import { paymentRepository } from '../repository/payment.repository'
import { productRepository } from '../repository/product.repository'

export const useFetchCategories = () => {
  const { listCategories } = categoryRepository()
  return useLazyAsyncData(`categories`, async () => {
    return await listCategories()
  })
}

export const useFetchCollections = () => {
  const { listCollections } = collectionRepository()
  return useLazyAsyncData(`collections`, async () => {
    return await listCollections()
  })
}

export const useFetchCollectionByHandle = (handle: string) => {
  const { fetchCollectionByHandle } = collectionRepository()
  return useLazyAsyncData(
    `collection:${handle}`,
    async () => await fetchCollectionByHandle(handle),
  )
}

export const useFetchCategoryByHandle = (handle: string) => {
  const { fetchCategoryByHandle } = categoryRepository()
  return useLazyAsyncData(
    `category:${handle}`,
    async () => await fetchCategoryByHandle(handle),
  )
}

export const useFetchProducts = (
  query: MaybeRef<StoreProductListParams>,
  prefetch?: boolean,
) => {
  const { country } = useCountry()
  const { listProducts } = productRepository()

  const queryRef = toRef(query)

  const queryParams = computed(() => ({
    region_id: country.value?.region_id,
    ...queryRef.value,
  }))

  const key = computed(
    () =>
      `products:${queryParams.value?.collection_id}:${queryParams.value?.category_id}:${queryParams.value?.limit}:${queryParams.value?.offset}:${country.value?.region_id}`,
  )

  return useLazyAsyncData(
    key.value,
    async () => {
      return await listProducts(queryParams.value)
    },
    {
      watch: prefetch ? undefined : [queryParams],
      immediate: !prefetch,
    },
  )
}

const findProductInPayload = (
  payload: Record<string, unknown>,
  handle: string,
) => {
  let foundProduct: unknown

  Object.values(payload).forEach((entry) => {
    if (foundProduct) return

    const productsList = (entry as { products?: unknown }).products
    if (!Array.isArray(productsList)) return

    const product = productsList.find(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        (item as Record<string, unknown>).handle === handle,
    )

    if (product) foundProduct = product
  })

  return foundProduct
}

export const useFetchProductByHandle = (handle: string) => {
  const { country } = useCountry()
  const NuxtApp = useNuxtApp()
  const { fetchProductByHandle } = productRepository()

  return useLazyAsyncData(
    `product:${handle}:region:${country.value?.region_id}`,
    async () => {
      return await fetchProductByHandle(handle, {
        region_id: country.value?.region_id,
      })
    },
    {
      default: () => findProductInPayload(NuxtApp.payload.data, handle),
    },
  )
}

export const useFetchCountries = () => {
  return useLazyFetch('/api/regions', {
    key: 'countries',
    transform: (data) => getCountriesFromRegions(data?.regions),
  })
}

export const useCart = () => {
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
      updateCart({ region_id: country.value?.region_id })
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
    refreshNuxtData(`cart`)
    return cart
  }

  const createLineItem = async (item: StoreAddCartLineItem) => {
    if (!cartId.value)
      throw new Error(
        'No existing cart found, please create one before updating',
      )

    const cart = await repositoryCreateLineItem(cartId.value, item)
    refreshNuxtData(`cart`)
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
    refreshNuxtData(`cart`)
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
    refreshNuxtData(`cart`)
    return deleted
  }

  const addShippingMethod = async (
    shippingMethodId: StoreCartShippingMethod['id'],
  ) => {
    if (!cartId.value)
      throw new Error(
        'No existing cart found, please create one before updating',
      )

    const cart = await repositoryAddShippingMethod(
      cartId.value,
      shippingMethodId,
    )
    refreshNuxtData(`cart`)
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

export const useFetchOrder = (orderId: StoreOrder['id']) => {
  const medusa = useMedusaClient()

  return useLazyAsyncData(
    `order:${orderId}`,
    async () =>
      await medusa.store.order.retrieve(orderId, {
        fields:
          '*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product',
      }),
    {
      transform: (data) => data.order,
    },
  )
}

export const useFetchShippingOptions = () => {
  const medusa = useMedusaClient()
  const { cartId } = useUserCart()

  return useLazyAsyncData(
    `shipping-options`,
    async () => {
      if (!cartId.value) {
        return null
      }
      return await medusa.store.fulfillment.listCartOptions({
        cart_id: cartId.value,
      })
    },
    {},
  )
}

export const useFetchPaymentProviders = () => {
  const { country } = useCountry()
  const { listPaymentProviders } = paymentRepository()

  return useLazyAsyncData(
    `payment-providers`,
    async () => {
      if (!country.value?.region_id) {
        return null
      }
      return await listPaymentProviders({
        region_id: country.value?.region_id,
      })
    },
    {},
  )
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
