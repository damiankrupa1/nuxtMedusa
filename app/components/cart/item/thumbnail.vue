<script lang="ts" setup>
import type { AppRoute } from '~/types/link'

defineProps<{
  src?: string
  alt: string
  link?: AppRoute
}>()
</script>

<template>
  <AppLink :to="link">
    <NuxtImg
      v-if="src"
      :src="src"
      :alt="alt"
      sizes="96px"
      class="w-full h-full object-cover aspect-[1/1] rounded-lg shadow border border-neutral-200"
    />
    <!-- Without a thumbnail an <img> would get src="undefined", which the
    browser requests as a page. An empty tile of the same size instead, named
    like the image so the link keeps its name. -->
    <div
      v-else
      role="img"
      :aria-label="alt"
      class="w-full aspect-[1/1] rounded-lg shadow border border-neutral-200 bg-color-sand"
    />
  </AppLink>
</template>
