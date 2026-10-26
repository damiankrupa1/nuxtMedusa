<script lang="ts" setup>
import type { StatusType } from '~/types/ui'

// The live region is always mounted and empty while there is no message, so a
// caller's class (spacing) goes on the visible alert, not on the region.
defineOptions({ inheritAttrs: false })

const {
  type,
  message = null,
  description = null,
} = defineProps<{
  type: StatusType
  message?: string | null
  description?: string | null
}>()

const icons: Record<StatusType, string> = {
  error: 'i-lucide-alert-circle',
  success: 'i-lucide-circle-check',
  warning: 'i-lucide-triangle-alert',
  info: 'i-lucide-info',
}

const region = ref<HTMLElement | null>(null)

defineExpose({
  focus: () => region.value?.focus(),
})
</script>

<template>
  <div ref="region" :role="type === 'error' ? 'alert' : 'status'" tabindex="-1">
    <UAlert
      v-if="message"
      v-bind="$attrs"
      :color="type"
      variant="soft"
      :icon="icons[type]"
      :title="message"
      :description="description ?? undefined"
    />
  </div>
</template>
