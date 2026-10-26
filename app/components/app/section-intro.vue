<script lang="ts" setup>
import type { DisplayHeadingSize, HeadingLevel, SectionTone } from '~/types/ui'

const {
  as = 'h2',
  size = 'md',
  tone = 'light',
} = defineProps<{
  eyebrow: string
  heading?: string
  as?: HeadingLevel
  size?: DisplayHeadingSize
  tone?: SectionTone
}>()

const mutedText = computed(() =>
  tone === 'dark' ? 'text-color-sage' : 'text-color-muted',
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="text-[10px]" :class="mutedText">
      {{ eyebrow }}
    </p>
    <AppHeading
      v-if="heading"
      :as="as"
      variant="display"
      :size="size"
      :tone="tone"
    >
      {{ heading }}
    </AppHeading>
    <p
      v-if="$slots.default"
      class="mt-2 text-[13px] leading-[1.7]"
      :class="mutedText"
    >
      <slot />
    </p>
  </div>
</template>
