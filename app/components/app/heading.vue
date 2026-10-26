<script lang="ts" setup>
import type {
  DisplayHeadingSize,
  HeadingLevel,
  HeadingVariant,
  SectionTone,
} from '~/types/ui'

const {
  variant = 'title',
  size = 'md',
  tone = 'light',
} = defineProps<{
  as: HeadingLevel
  variant?: HeadingVariant
  size?: DisplayHeadingSize
  tone?: SectionTone
}>()

const displaySizes: Record<DisplayHeadingSize, string> = {
  md: 'text-4xl leading-[1.05] md:text-[48px]',
  lg: 'text-4xl leading-[1.05] md:text-[56px]',
  hero: 'text-5xl leading-[0.94] sm:text-6xl lg:text-[88px]',
}

const classes = computed(() =>
  variant === 'display'
    ? [
        'font-serif',
        displaySizes[size],
        tone === 'dark' ? 'text-color-paper' : 'text-color-ink',
      ]
    : 'text-3xl font-medium text-color-highlighted',
)
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
