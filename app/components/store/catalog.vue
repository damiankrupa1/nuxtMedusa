<script setup lang="ts">
import { useFetchProducts } from '~/composables/product'

const { defaultProductsPerPage } = useAppConfig()
const { t } = useI18n()

const { title, collectionId, categoryId, q } = defineProps<{
  title?: string
  collectionId?: string
  categoryId?: string
  q?: string
}>()

const { sortOptions, sortBy, pageNumber } = useFilters()

const productsQuery = computed(() => ({
  collection_id: collectionId,
  category_id: categoryId,
  q: q || undefined,
  limit: defaultProductsPerPage,
  offset: (pageNumber.value - 1) * defaultProductsPerPage,
}))

const { data } = await useFetchProducts(productsQuery)

const products = computed(() => data.value?.products)
const count = computed(() => data.value?.count || 0)

const displayPagination = computed(() => count.value > defaultProductsPerPage)

// Non-functional placeholders — only "category" is backed by real filtering
// today (via categoryId/collectionId routing). See missing-medusa-api-data
// skill for what the rest would need before they can filter anything.
const filterFacets = computed(() => [
  t('store.catalog.filterLabels.forWhom'),
  t('store.catalog.filterLabels.category'),
  t('store.catalog.filterLabels.size'),
  t('store.catalog.filterLabels.color'),
  t('store.catalog.filterLabels.material'),
  t('store.catalog.filterLabels.price'),
  t('store.catalog.filterLabels.brand'),
])
</script>

<template>
  <UContainer class="py-6">
    <div class="flex flex-col gap-[22px]">
      <div class="flex items-center justify-between gap-4">
        <AppHeading v-if="(title || q) && products" as="h1" size="sm">
          <template v-if="q">
            {{ $t('store.catalog.searchResultsFor', { query: q, count }) }}
          </template>
          <template v-else>{{ title }} ({{ count }})</template>
        </AppHeading>
        <USkeleton v-else class="h-7 w-[220px]" />

        <div v-if="products" class="flex items-center gap-3 shrink-0">
          <span class="text-xs text-color-dimmed">{{
            $t('store.catalog.sortBy')
          }}</span>
          <USelect
            v-model="sortBy"
            :items="sortOptions"
            variant="none"
            color="neutral"
            size="xs"
          />
        </div>
      </div>

      <div
        class="flex items-center gap-8 overflow-x-auto border-y border-color-line py-4"
      >
        <div class="flex items-center gap-[9px] shrink-0 text-color-ink">
          <UIcon name="i-lucide-sliders-horizontal" class="size-[17px]" />
          <span class="text-xs font-medium whitespace-nowrap">{{
            $t('store.catalog.filters')
          }}</span>
        </div>
        <span
          v-for="facet in filterFacets"
          :key="facet"
          class="flex items-center gap-1.5 shrink-0 text-xs text-color-ink whitespace-nowrap"
        >
          {{ facet }}
          <UIcon
            name="i-lucide-chevron-down"
            class="size-3 text-color-dimmed"
          />
        </span>
      </div>
    </div>

    <p
      v-if="products && products.length === 0"
      class="mt-8 mb-8 text-sm text-color-dimmed"
    >
      {{ $t('store.catalog.noResults') }}
    </p>
    <ProductList
      v-else-if="products"
      :products="products"
      :sort-by="sortBy"
      with-save-icon
      class="mt-8 mb-8"
    />
    <ProductListSkeleton v-else class="mt-8 mb-8" />
    <div v-if="displayPagination" class="flex justify-end">
      <UPagination
        v-model:page="pageNumber"
        active-color="neutral"
        :items-per-page="defaultProductsPerPage"
        :total="count"
      />
    </div>
  </UContainer>
</template>
