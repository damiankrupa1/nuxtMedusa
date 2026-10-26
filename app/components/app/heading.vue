<script lang="ts" setup>
import type {
  HeadingLevel,
  HeadingSize,
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
  // `title` has `sm` | `md` (`TitleHeadingSize`), `display` has `md` | `lg` |
  // `hero` (`DisplayHeadingSize`); a size the variant doesn't have falls back
  // to `md`. The size is chosen here, never through `class`.
  size?: HeadingSize
  tone?: SectionTone
}>()

const sizes: Record<HeadingVariant, Partial<Record<HeadingSize, string>>> = {
  title: {
    sm: 'text-lg',
    md: 'text-3xl',
  },
  display: {
    md: 'text-4xl leading-[1.05] md:text-[48px]',
    lg: 'text-4xl leading-[1.05] md:text-[56px]',
    hero: 'text-5xl leading-[0.94] sm:text-6xl lg:text-[88px]',
  },
}

const classes = computed(() => {
  const sizeClass = sizes[variant][size] ?? sizes[variant].md
  return variant === 'display'
    ? [
        'font-serif',
        sizeClass,
        tone === 'dark' ? 'text-color-paper' : 'text-color-ink',
      ]
    : [sizeClass, 'font-medium text-color-highlighted']
})
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
