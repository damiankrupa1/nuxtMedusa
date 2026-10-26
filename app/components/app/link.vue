<script setup lang="ts">
// TODO(#20): consider a named-route (RouteLocationRaw) variant of `to`
// instead of/alongside plain path strings, once experimental.typedPages is
// enabled — would need to keep auto-injecting countryCode as a param.
const { country } = useCountry()

const { to, countryCode } = defineProps<{
  to?: string
  countryCode?: string
}>()

const link = computed(() => {
  if (!to) return undefined
  return `/${countryCode || country.value?.iso_2}${to}`
})
</script>

<template>
  <span>
    <NuxtLink v-if="link" prefetch :to="link">
      <slot />
    </NuxtLink>
    <slot v-else />
  </span>
</template>
