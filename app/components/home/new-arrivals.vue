<script setup lang="ts">
const { t } = useI18n()
const { women, men } = await useDepartmentCategories()

type TabKey = 'women' | 'men' | 'studio'
const activeTab = ref<TabKey>('women')

const tabs: { key: TabKey; labelKey: string }[] = [
  { key: 'women', labelKey: 'pages.home.newArrivals.tabWomen' },
  { key: 'men', labelKey: 'pages.home.newArrivals.tabMen' },
  { key: 'studio', labelKey: 'pages.home.newArrivals.tabStudio' },
]

// "Fashion Studio" tab has no backing category/collection in this catalog —
// falls back to the newest products overall, see missing-medusa-api-data.
const activeCategoryId = computed(() => {
  if (activeTab.value === 'women') return women.value?.id
  if (activeTab.value === 'men') return men.value?.id
  return undefined
})

const { data: productsResponse, status } = await useFetchProducts(
  computed(() => ({ category_id: activeCategoryId.value, limit: 4 })),
)
const products = computed(() => productsResponse.value?.products || [])
const isLoading = computed(() => status.value === 'pending')
</script>

<template>
  <section class="flex flex-col gap-[30px] px-6 pb-20 pt-16 md:px-16 md:pt-[72px]">
    <div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <div class="flex flex-col gap-2.5">
        <p class="text-[10px] text-color-muted">{{ $t('pages.home.newArrivals.eyebrow') }}</p>
        <h2 class="font-serif text-4xl leading-[1.05] text-color-ink md:text-[48px]">
          {{ $t('pages.home.newArrivals.heading') }}
        </h2>
      </div>
      <AppLink
        to="/store"
        class="flex items-center gap-4 border-b border-color-ink pb-2 text-[13px] text-color-ink"
      >
        {{ $t('pages.home.newArrivals.viewAll') }}
        <UIcon name="i-lucide-arrow-up-right" class="size-4" />
      </AppLink>
    </div>

    <div class="flex items-center gap-6">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="flex flex-col gap-2 text-xs"
        :class="activeTab === tab.key ? 'font-medium text-color-ink' : 'text-color-muted'"
        @click="activeTab = tab.key"
      >
        {{ $t(tab.labelKey) }}
        <span v-if="activeTab === tab.key" class="h-px w-full bg-color-ink" />
      </button>
    </div>

    <ProductList
      v-if="!isLoading && products.length"
      :products="products"
      :badge="t('pages.home.newArrivals.badge')"
      with-save-icon
    />
    <ul v-else class="grid w-full grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
      <li v-for="n in 4" :key="n">
        <ProductCard with-save-icon />
      </li>
    </ul>

    <div class="flex h-0.5 w-full">
      <div class="h-full w-[328px] bg-color-ink" />
      <div class="h-full flex-1 bg-color-line" />
    </div>
  </section>
</template>
