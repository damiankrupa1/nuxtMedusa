<script setup lang="ts">
import type { AppLinkTarget } from '~/types/link'

const { to, countryCode } = defineProps<{
  to: AppLinkTarget
  countryCode?: string
}>()

const link = useCountryLink(
  () => to,
  () => countryCode,
)
</script>

<template>
  <UButton
    :to="link"
    prefetch
    color="primary"
    variant="link"
    :trailing="true"
    class="group"
  >
    <slot />
    <template #trailing>
      <UIcon
        name="i-lucide-arrow-up-right"
        class="group-hover:rotate-45 ease-in-out duration-150 size-5"
      />
    </template>
  </UButton>
</template>
