<script setup lang="ts">
const route = useRoute()

const handle = computed(() => route.params.handle as string)
const { data: product } = await useFetchProductByHandle(handle.value)

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
    <ProductDetail :product="product" />
    <!-- TODO: Implement ProductRelated component -->
    <!-- <LazyProductRelated :product="product" /> -->
  </div>
</template>
