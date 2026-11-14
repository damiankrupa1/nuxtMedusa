<script lang="ts" setup>
import type { StoreProduct } from '@medusajs/types'

defineProps<{
  product: StoreProduct
}>()
</script>

<!--
  TODO(#59): the design is 1440px wide only. Below `lg` the gallery stacks
  above the panel; confirm that layout or get a mobile design.
-->
<template>
  <section
    class="flex flex-col gap-10 px-6 py-8 lg:flex-row lg:items-start lg:gap-16 lg:px-16 lg:pb-20 lg:pt-8"
  >
    <ProductGallery :product="product" class="min-w-0 lg:flex-1" />
    <ProductPurchasePanel
      :product="product"
      class="w-full lg:sticky lg:top-8 lg:w-[480px] lg:shrink-0"
    />
  </section>
</template>
