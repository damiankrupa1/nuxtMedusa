<script setup lang="ts">
import type { StoreProduct } from '@medusajs/types'

defineProps<{
  product?: StoreProduct
}>()
</script>

<template>
  <div class="flex items-start relative">
    <div class="flex flex-col flex-1 sm:mx-16 gap-y-4">
      <div
        v-if="product"
        class="rounded-lg bg-color-muted relative aspect-[29/34] w-full overflow-hidden border border-color-muted"
      >
        <NuxtImg
          v-if="product?.images?.[0]?.url"
          :src="product?.images?.[0]?.url"
          :alt="product?.title"
          sizes="100vw sm:40vw"
          class="w-full h-full object-cover"
        />
      </div>
      <USkeleton
        v-else
        class="rounded-lg relative overflow-hidden aspect-[11/14] w-full"
      />
    </div>
  </div>
</template>
