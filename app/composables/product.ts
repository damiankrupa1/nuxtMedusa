import type { StoreProduct, StoreProductListParams } from '@medusajs/types'
import lodash from 'lodash'
import { productRepository } from '~/repository/product.repository'

const { isEqual } = lodash

export const useFetchProducts = (
  query: MaybeRef<StoreProductListParams>,
  prefetch?: boolean,
) => {
  const { country } = useCountry()
  const { locale } = useI18n()
  const { listProducts } = productRepository()

  const queryRef = toRef(query)
  const medusaLocale = computed(() => toMedusaLocale(locale.value))

  const queryParams = computed(() => ({
    region_id: country.value?.region_id,
    ...queryRef.value,
  }))

  const key = computed(
    () =>
      `products:${queryParams.value?.collection_id}:${queryParams.value?.category_id}:${queryParams.value?.q}:${queryParams.value?.limit}:${queryParams.value?.offset}:${country.value?.region_id}:${medusaLocale.value}`,
  )

  return useLazyAsyncData(
    key.value,
    async () => await listProducts(queryParams.value, medusaLocale.value),
    {
      watch: prefetch ? undefined : [queryParams, medusaLocale],
      immediate: !prefetch,
    },
  )
}

export const useFetchProductByHandle = (handle: string) => {
  const { country } = useCountry()
  const { locale } = useI18n()
  const NuxtApp = useNuxtApp()
  const { fetchProductByHandle } = productRepository()
  const medusaLocale = toMedusaLocale(locale.value)

  return useLazyAsyncData<StoreProduct | null>(
    `product:${handle}:region:${country.value?.region_id}:locale:${medusaLocale}`,
    async () => {
      return await fetchProductByHandle(
        handle,
        { region_id: country.value?.region_id },
        medusaLocale,
      )
    },
    {
      default: () => findProductInPayload(NuxtApp.payload.data, handle),
    },
  )
}

// Selected options of a product and the variant they resolve to. A product
// with a single variant starts fully selected; otherwise the first value of a
// color option is preselected (the design shows "Kolor: Ecru" chosen), and
// the shopper still has to pick the rest, e.g. the size.
// TODO(#59): confirm the color preselection; the design only shows the
// selected state, not what a fresh page starts with.
export const useVariantSelection = (product: () => StoreProduct) => {
  const selectedOptions = ref<Record<string, string> | null>(null)

  watch(
    product,
    (current) => {
      const variants = current.variants ?? []
      if (variants.length === 1 && variants[0]?.options) {
        selectedOptions.value = optionsAsKeyMap(variants[0].options)
        return
      }
      const preselected: Record<string, string> = {}
      const colorOptions = (current.options ?? []).filter(isColorOption)
      colorOptions.forEach((option) => {
        const first = option.values?.[0]?.value
        if (first) preselected[option.id] = first
      })
      selectedOptions.value = Object.keys(preselected).length
        ? preselected
        : null
    },
    { immediate: true },
  )

  const selectedVariant = computed(
    () =>
      (selectedOptions.value &&
        product().variants?.find((variant) =>
          isEqual(optionsAsKeyMap(variant.options), selectedOptions.value),
        )) ||
      null,
  )

  const availability = computed<'unselected' | 'inStock' | 'outOfStock'>(() => {
    if (!selectedVariant.value) return 'unselected'
    return isVariantInStock(selectedVariant.value) ? 'inStock' : 'outOfStock'
  })

  function setOptionValue({
    optionId,
    value,
  }: {
    optionId: string
    value: string
  }) {
    selectedOptions.value = { ...selectedOptions.value, [optionId]: value }
  }

  return { selectedOptions, selectedVariant, availability, setOptionValue }
}
