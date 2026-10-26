<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <AppHeader />
    <NuxtLoadingIndicator color="black" />
    <main class="relative">
      <slot />
    </main>
    <template v-if="route.meta.prefooter">
      <AppBenefitsBar />
      <AppNewsletter />
    </template>
    <AppFooter />
  </UApp>
</template>
