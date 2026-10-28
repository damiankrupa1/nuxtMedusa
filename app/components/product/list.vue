<script lang="ts" setup>
import type { StoreProduct } from '@medusajs/types'
import type { SortOptionsType } from '~/types/filter'

const { products, sortBy, badge, withSaveIcon } = defineProps<{
  products: StoreProduct[]
  sortBy?: SortOptionsType
  badge?: string
  withSaveIcon?: boolean
}>()

const productsSorted = computed(() => sortProducts(products, sortBy))
</script>

<template>
  <ul
    class="grid grid-cols-2 w-full sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-8"
  >
    <li v-for="product in productsSorted" :key="product.id">
      <ProductCard
        :product="product"
        :badge="badge"
        :with-save-icon="withSaveIcon"
      />
    </li>
  </ul>
</template>
