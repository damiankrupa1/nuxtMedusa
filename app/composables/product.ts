import type { StoreProduct, StoreProductListParams } from '@medusajs/types'
import { productRepository } from '../repository/product.repository'

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
    async () => await listProducts(queryParams.value),
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
  let foundProduct: StoreProduct | null = null

  Object.values(payload).forEach((entry) => {
    if (foundProduct) return

    const productsList = (entry as { products?: unknown }).products
    if (!Array.isArray(productsList)) return

    const product = productsList.find(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        (item as Record<string, unknown>).handle === handle,
    ) as StoreProduct | undefined

    if (product) foundProduct = product
  })

  return foundProduct
}

export const useFetchProductByHandle = (handle: string) => {
  const { country } = useCountry()
  const NuxtApp = useNuxtApp()
  const { fetchProductByHandle } = productRepository()

  return useLazyAsyncData<StoreProduct | null>(
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
