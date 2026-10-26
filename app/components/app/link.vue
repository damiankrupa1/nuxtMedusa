<script setup lang="ts">
import type { AppLinkTarget } from '~/types/link'

const { to, countryCode } = defineProps<{
  /**
   * Path relative to `/[countryCode]` (static pages, CMS URLs) or a named
   * route without `countryCode` — use the named form for routes with params.
   */
  to?: AppLinkTarget
  countryCode?: string
}>()

const link = useCountryLink(
  () => to,
  () => countryCode,
)
</script>

<template>
  <span>
    <NuxtLink v-if="link" prefetch :to="link">
      <slot />
    </NuxtLink>
    <slot v-else />
  </span>
</template>
