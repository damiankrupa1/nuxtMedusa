<script lang="ts" setup>
defineProps<{
  src?: string
  alt: string
  link: string
}>()
</script>

<template>
  <AppLink :to="link">
    <NuxtImg
      :src="src"
      :alt="alt"
      sizes="96px"
      class="w-full h-full object-cover aspect-[1/1] rounded-lg shadow border border-neutral-200"
    />
  </AppLink>
</template>
