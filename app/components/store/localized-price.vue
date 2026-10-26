<script lang="ts" setup>
const { country } = useCountry()

// Medusa's calculated prices are nullable, so `null` is accepted and formatted
// like a missing value (convertToLocale's defaults).
const { amount, currencyCode } = defineProps<{
  amount?: number | null
  currencyCode?: string | null
}>()

const localizedPrice = computed(() =>
  convertToLocale({
    amount: amount ?? undefined,
    currency_code: currencyCode ?? undefined,
    country: country.value?.iso_2,
  }),
)
</script>

<template>
  <span>
    {{ localizedPrice }}
  </span>
</template>
