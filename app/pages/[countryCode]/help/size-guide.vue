<script setup lang="ts">
// Information page (#107): route, status and sections in INFO_PAGES
// (app/utils/info-pages.ts), copy in i18n under `pages.sizeGuide`.
definePageMeta({ cdnCache: true, prefooter: true })

useInfoPageSeo('sizeGuide')
</script>

<template>
  <InfoPage id="sizeGuide" />
</template>
