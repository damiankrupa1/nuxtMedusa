<script setup lang="ts">
const { data: navigation } = useFetchNavigation()
</script>

<template>
  <nav
    v-if="navigation?.primaryNav.length"
    class="hidden lg:flex h-[50px] items-center justify-center gap-x-9 border-y border-color-line text-xs"
  >
    <AppLink
      v-for="item in navigation.primaryNav"
      :key="item.url"
      :to="item.url"
      class="text-color-ink"
    >
      {{ item.label }}
    </AppLink>
  </nav>
</template>
