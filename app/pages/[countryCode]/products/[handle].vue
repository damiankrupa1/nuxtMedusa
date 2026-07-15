<script setup lang="ts">
const route = useRoute()

const handle = computed(() => route.params.handle as string)
const { data: product } = await useFetchProductByHandle(handle.value)

// useSeoMeta({ //TODO: Uncomment this when product data is available
//   title: product.title,
//   description: product.description,
//   ogTitle: product.title,
//   ogDescription: product.description,
//   ogImage: product.thumbnail,
//   ogType: 'product',
// })
</script>

<template>
  <div>
    <ProductDetail :product="product" />
    <!-- TODO: Implement ProductRelated component -->
    <!-- <LazyProductRelated :product="product" /> -->
  </div>
</template>
