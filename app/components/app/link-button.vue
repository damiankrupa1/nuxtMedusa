<script setup lang="ts">
import type { AppLinkTarget } from '~/types/link'

// The redesign's underlined "text ↗" link.

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
    color="neutral"
    variant="link"
    trailing-icon="i-lucide-arrow-up-right"
    class="group gap-4 rounded-none border-b border-color-ink p-0 pb-2 text-[13px] font-normal text-color-ink hover:text-color-ink focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ink)"
    :ui="{
      trailingIcon:
        'size-4 transition-transform duration-150 ease-in-out group-hover:rotate-45 motion-reduce:transition-none',
    }"
  >
    <slot />
  </UButton>
</template>
