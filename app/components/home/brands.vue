<script setup lang="ts">
const { title } = useAppConfig()

// Brand names are proper nouns (not translated) — no brand/manufacturer
// concept exists in Medusa, see missing-cms-content skill.
const otherBrands = ['SELECTED', 'Samsøe Samsøe', "MARC O'POLO", 'BIRKENSTOCK']
</script>

<template>
  <section class="flex flex-col gap-8 border-b border-color-line px-6 py-10 md:px-16 md:py-[52px]">
    <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-[10px] text-color-muted">{{ $t('pages.home.brands.eyebrow') }}</p>
      <AppLink
        to="/store"
        class="flex items-center gap-4 border-b border-color-ink pb-2 text-[13px] text-color-ink"
      >
        {{ $t('pages.home.brands.viewAll') }}
        <UIcon name="i-lucide-arrow-up-right" class="size-4" />
      </AppLink>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-color-ink">
      <p class="text-2xl font-medium">{{ title }}</p>
      <p v-for="brand in otherBrands" :key="brand" class="text-xl">
        {{ brand }}
      </p>
    </div>
  </section>
</template>
