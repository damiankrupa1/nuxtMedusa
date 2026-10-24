<script setup lang="ts">
</script>

<template>
  <nav
    class="hidden lg:flex h-[50px] items-center justify-center gap-x-9 border-y border-color-line text-xs"
  >
    <AppLink
      v-for="item in primaryNav"
      :key="item.labelKey"
      :to="item.to"
      class="text-color-ink"
    >
      {{ $t(item.labelKey) }}
    </AppLink>
  </nav>
</template>
