<script setup lang="ts">
const countries = await useCountries()
const value = defineModel<string>()
</script>

<template>
  <USelect
    v-model="value"
    :items="countries"
    value-key="iso_2"
    label-key="display_name"
    class="w-full"
    :placeholder="$t('store.selectCountry.placeholder')"
    color="neutral"
    required
  />
</template>
