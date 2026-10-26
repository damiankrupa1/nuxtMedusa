import type {
  StoreAddCartLineItem,
  StoreCart,
  StoreCartShippingOption,
  StoreOrder,
  StoreUpdateCart,
  StoreUpdateCartLineItem,
} from '@medusajs/types'
import { useCartService } from '../services/cart.service'

export const useUserCart = () => {
  const cartIdCookie = useCookie('cart_id', {
    maxAge: 60 * 60 * 24 * 90,
  })

  const setCartId = (cartId?: string) => {
    if (!cartId) cartIdCookie.value = null
    cartIdCookie.value = cartId
  }

  return {
    cartId: computed(() => cartIdCookie.value || null),
    setCartId,
  }
}

export const useCartDropdown = () => {
  const route = useRoute()
  const isCartDropdownOpen = useState('cart-dropdown', () => false)

  watch(route, (newRoute) => {
    if (newRoute.path.includes('cart')) isCartDropdownOpen.value = false
  })

  return {
    isCartDropdownOpen,
  }
}

// `{ cart: null }` until the first add to cart creates one, so visitors who
// only browse don't leave empty carts in Medusa
export const useFetchCart = async () => {
  const { retrieveCart } = useCartService()

  return useLazyAsyncData('cart', async () => await retrieveCart())
}

export const useAddToCart = () => {
  const { updateOrCreateLineItem } = useCartService()

  const loading = ref(false)
  const data = ref<StoreCart | null>(null)

  const mutate = async (item: StoreAddCartLineItem) => {
    loading.value = true

    try {
      data.value = await updateOrCreateLineItem(item)
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

export const useUpdateCart = () => {
  const { updateCart } = useCartService()

  const loading = ref(false)
  const data = ref<StoreCart | null>(null)

  const mutate = async (dataToUpdate: StoreUpdateCart) => {
    loading.value = true

    try {
      data.value = await updateCart(dataToUpdate)
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

export const useUpdateLineItem = () => {
  const { updateLineItem } = useCartService()

  const loading = ref(false)
  const data = ref<StoreCart | null>(null)

  const mutate = async (
    itemId: string,
    dataToUpdate: StoreUpdateCartLineItem,
  ) => {
    loading.value = true

    try {
      data.value = await updateLineItem(itemId, dataToUpdate)
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

export const useDeleteLineItem = () => {
  const { deleteLineItem } = useCartService()

  const loading = ref(false)
  const data = ref<boolean | null>(null)

  const mutate = async (itemId: string) => {
    loading.value = true

    try {
      data.value = await deleteLineItem(itemId)
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

export const useSetShippingMethod = () => {
  const { addShippingMethod } = useCartService()

  const loading = ref(false)
  const data = ref<StoreCart | null>(null)

  const mutate = async (
    optionId: StoreCartShippingOption['id'],
    fulfillmentData?: Record<string, unknown>,
  ) => {
    loading.value = true

    try {
      data.value = await addShippingMethod(optionId, fulfillmentData)
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

export const usePlaceOrder = () => {
  const { completeOrder } = useCartService()
  const { setCartId } = useUserCart()
  const { country } = useCountry()

  const loading = ref(false)
  const data = ref<StoreOrder | StoreCart | null>(null)

  const mutate = async () => {
    loading.value = true

    try {
      const orderResponse = await completeOrder()
      if (orderResponse.type === 'order') {
        setCartId()
        refreshNuxtData(`cart`)
        data.value = orderResponse.order
        navigateTo(
          `/${country.value?.iso_2}/order/${orderResponse.order.id}/confirmed`,
        )
        return
      }

      data.value = orderResponse.cart
      // Medusa answers with the cart when it couldn't authorize the payment
      const error = new Error(orderResponse.error.message)
      captureError(error, { source: 'medusa', type: orderResponse.error.type })
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
