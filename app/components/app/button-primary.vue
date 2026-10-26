<script lang="ts" setup>
const { country } = useCountry()

const { to, inverted } = defineProps<{
  type?: 'button' | 'submit' | 'reset'
  // A path without the country prefix, like AppLink's.
  to?: string
  loading?: boolean
  disabled?: boolean
  block?: boolean
  trailingIcon?: string
  // Paper background and ink text, for dark sections.
  inverted?: boolean
}>()

const link = computed(() => (to ? `/${country.value?.iso_2}${to}` : undefined))

// Every state is set explicitly, so the theme's neutral solid colors
// (--ui-bg-inverted while hovered, disabled or loading) never show through.
const colors = computed(() =>
  inverted
    ? 'bg-color-paper text-color-ink hover:bg-(--color-paper)/90 disabled:bg-color-paper aria-disabled:bg-color-paper focus-visible:outline-(--color-paper)'
    : 'bg-color-ink text-color-paper hover:bg-(--color-ink)/90 disabled:bg-color-ink aria-disabled:bg-color-ink focus-visible:outline-(--color-ink)',
)
</script>

<template>
  <UButton
    :type="type || 'button'"
    :to="link"
    :loading="loading"
    :disabled="disabled"
    :block="block"
    :trailing-icon="trailingIcon"
    variant="solid"
    color="neutral"
    class="h-12 gap-7 rounded-none px-6 py-0 text-xs font-medium"
    :class="colors"
    :ui="{ trailingIcon: 'size-[18px]' }"
  >
    <slot />
  </UButton>
</template>
