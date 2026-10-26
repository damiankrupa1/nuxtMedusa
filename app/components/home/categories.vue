<script setup lang="ts">
// Curated feature grid, not a raw category listing — card copy/images are
// editorial. Falls back to the cards below when Payload has no
// CategoryTiles global yet, none of its categoryHandles still resolve to a
// real Medusa category, or it's unreachable — see missing-cms-content
// skill. Link targets are always real categories from the connected
// Medusa catalog either way.
const fallbackCards = [
  {
    key: 'knitwear',
    handle: 'sweaters-cardigans',
    image: '/images/home/category-knitwear.jpg',
  },
  {
    key: 'shirts',
    handle: 'shirts',
    image: '/images/home/category-shirts.jpg',
  },
  {
    key: 'coats',
    handle: 'jackets-coats',
    image: '/images/home/category-coats.jpg',
  },
  {
    key: 'accessories',
    handle: 'accessories',
    image: '/images/home/category-accessories.jpg',
  },
]

const { data: categoryTiles } = useFetchCategoryTiles()
const cms = computed(() => categoryTiles.value ?? null)
</script>

<template>
  <section class="flex flex-col gap-8 px-6 py-16 md:px-16 md:py-[88px]">
    <div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <div class="flex flex-col gap-3">
        <p class="text-[10px] text-color-muted">
          {{ cms?.eyebrow ?? $t('pages.home.categories.eyebrow') }}
        </p>
        <h2 class="font-serif text-4xl leading-[1.05] text-color-ink md:text-[48px]">
          {{ cms?.heading ?? $t('pages.home.categories.heading') }}
        </h2>
      </div>
      <p class="max-w-[320px] text-[13px] leading-[1.7] text-color-muted">
        {{ cms?.description ?? $t('pages.home.categories.description') }}
      </p>
    </div>

    <div v-if="cms" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <AppLink
        v-for="card in cms.cards"
        :key="card.categoryHandle"
        :to="`/categories/${card.categoryHandle}`"
        class="flex flex-col gap-[18px]"
      >
        <div class="h-[340px] w-full overflow-hidden">
          <img
            :src="card.image.url"
            :alt="card.image.alt"
            class="size-full object-cover"
            loading="lazy"
          >
        </div>
        <div class="flex items-center justify-between">
          <p class="font-serif text-[28px] text-color-ink">{{ card.title }}</p>
          <UIcon name="i-lucide-arrow-up-right" class="size-[19px] shrink-0 text-color-ink" />
        </div>
        <p class="text-xs text-color-muted">{{ card.subtitle }}</p>
      </AppLink>
    </div>
    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <AppLink
        v-for="card in fallbackCards"
        :key="card.key"
        :to="`/categories/${card.handle}`"
        class="flex flex-col gap-[18px]"
      >
        <div class="h-[340px] w-full overflow-hidden">
          <NuxtImg
            :src="card.image"
            :alt="$t(`pages.home.categories.${card.key}.imageAlt`)"
            width="1024"
            height="1024"
            sizes="100vw sm:50vw lg:25vw"
            class="size-full object-cover"
            loading="lazy"
          />
        </div>
        <div class="flex items-center justify-between">
          <p class="font-serif text-[28px] text-color-ink">
            {{ $t(`pages.home.categories.${card.key}.title`) }}
          </p>
          <UIcon name="i-lucide-arrow-up-right" class="size-[19px] shrink-0 text-color-ink" />
        </div>
        <p class="text-xs text-color-muted">
          {{ $t(`pages.home.categories.${card.key}.subtitle`) }}
        </p>
      </AppLink>
    </div>
  </section>
</template>
