<script setup lang="ts">
const { country } = useCountry()

// TODO: BaseRegionCountryWithRegionId carries no currency field — see
// missing-medusa-api-data skill. Mocked from a small iso2 -> currency map
// until the region's currency is exposed by useFetchCountries().
const currencyByCountry: Record<string, string> = {
  pl: 'PLN',
  us: 'USD',
  gb: 'GBP',
}

const currencyCode = computed(
  () => currencyByCountry[country.value?.iso_2 || ''] || '',
)
</script>

<template>
  <div
    class="hidden sm:flex h-[30px] items-center justify-between gap-x-6 px-16 bg-color-ink text-color-paper text-[10px] whitespace-nowrap overflow-hidden"
  >
    <p>{{ $t('app.header.announcement.promise') }}</p>
    <p class="truncate">{{ $t('app.header.announcement.shipping') }}</p>
    <p v-if="country" class="flex items-center gap-x-1">
      <span>{{ country.display_name }}</span>
      <span v-if="currencyCode">/ {{ currencyCode }}</span>
      <UIcon name="i-lucide-chevron-down" class="size-3" />
    </p>
  </div>
</template>
