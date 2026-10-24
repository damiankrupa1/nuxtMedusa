<script setup lang="ts">
const { data: navigation } = useFetchNavigation()
const cmsNav = computed(() => navigation.value?.primaryNav ?? null)
</script>

<template>
  <nav
    class="hidden lg:flex h-[50px] items-center justify-center gap-x-9 border-y border-color-line text-xs"
  >
    <template v-if="cmsNav">
      <AppLink
        v-for="item in cmsNav"
        :key="item.url"
        :to="item.url"
        class="text-color-ink"
      >
        {{ item.label }}
      </AppLink>
    </template>
    <template v-else>
      <AppLink
        v-for="item in primaryNav"
        :key="item.labelKey"
        :to="item.to"
        class="text-color-ink"
      >
        {{ $t(item.labelKey) }}
      </AppLink>
    </template>
  </nav>
</template>
