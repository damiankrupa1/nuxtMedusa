<script setup lang="ts">
const { title } = useAppConfig()

// Falls back to the i18n content below when Payload has no Brands global
// yet (or is unreachable) — see missing-cms-content skill. Brand names are
// proper nouns (not translated) — no brand/manufacturer concept exists in
// Medusa either way.
const fallbackOtherBrands = [
  'SELECTED',
  'Samsøe Samsøe',
  "MARC O'POLO",
  'BIRKENSTOCK',
]

const { data: brands } = useFetchBrands()
const cms = computed(() => brands.value ?? null)
</script>

<template>
  <section class="flex flex-col gap-8 border-b border-color-line px-6 py-10 md:px-16 md:py-[52px]">
    <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <AppSectionIntro
        :eyebrow="cms?.eyebrow ?? $t('pages.home.brands.eyebrow')"
      />
      <AppLinkButton :to="cms?.viewAllUrl ?? '/store'">
        {{ cms?.viewAllLabel ?? $t('pages.home.brands.viewAll') }}
      </AppLinkButton>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-color-ink">
      <p class="text-2xl font-medium">{{ title }}</p>
      <p v-for="brand in cms?.otherBrands ?? fallbackOtherBrands" :key="brand" class="text-xl">
        {{ brand }}
      </p>
    </div>
  </section>
</template>
