<script lang="ts" setup>
import type { UiSize } from '~/types/ui'

defineProps<{
  icon: string
  label: string
  size?: UiSize
}>()
</script>

<template>
  <UButton
    :icon="icon"
    :aria-label="label"
    type="button"
    variant="link"
    color="neutral"
    :size="size || 'md'"
  />
</template>
