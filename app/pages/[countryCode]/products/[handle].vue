<script setup lang="ts">
import { useFetchProductByHandle } from '~/composables/product'

// TODO(#59): no `prefooter` (benefits bar + newsletter) here, because the
// product screen of the design doesn't show them; confirm.
definePageMeta({ cdnCache: true })

const route = useRoute('countryCode-products-handle')

const handle = computed(() => route.params.handle)
const { data: product, status } = await useFetchProductByHandle(handle.value)
useNotFoundWhenMissing(product, status, 'Product not found')

const { canonicalUrl } = useCountrySeoLinks(() => !!product.value)
useProductJsonLd(product, canonicalUrl)

useSeoMeta({
  title: () => product.value?.title,
  description: () => product.value?.description ?? undefined,
  ogTitle: () => product.value?.title,
  ogDescription: () => product.value?.description ?? undefined,
  ogImage: () => product.value?.thumbnail ?? undefined,
  ogType: 'website',
})
</script>

<template>
  <div>
    <ProductDetail v-if="product" :product="product" />
    <!-- TODO: Implement ProductRelated component -->
    <!-- <LazyProductRelated :product="product" /> -->
  </div>
</template>
