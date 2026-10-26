<script setup lang="ts">
// The redesign's underlined "text ↗" link.
const { country } = useCountry()

const { to, countryCode } = defineProps<{
  to: string
  countryCode?: string
}>()

const link = computed(() => {
  return `/${countryCode || country.value?.iso_2}${to}`
})
</script>

<template>
  <UButton
    :to="link"
    prefetch
    color="neutral"
    variant="link"
    trailing-icon="i-lucide-arrow-up-right"
    class="group gap-4 rounded-none border-b border-color-ink p-0 pb-2 text-[13px] font-normal text-color-ink hover:text-color-ink"
    :ui="{
      trailingIcon:
        'size-4 transition-transform duration-150 ease-in-out group-hover:rotate-45 motion-reduce:transition-none',
    }"
  >
    <slot />
  </UButton>
</template>
