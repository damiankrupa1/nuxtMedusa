<script setup lang="ts">
// Information page (#107): route, status and sections in INFO_PAGES
// (app/utils/info-pages.ts), copy in i18n under `pages.studio`.
definePageMeta({ cdnCache: true, prefooter: true })

useInfoPageSeo('studio')
</script>

<template>
  <InfoPage id="studio" />
</template>
