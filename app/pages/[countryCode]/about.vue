<script setup lang="ts">
// Information page (#107): route, status and sections in INFO_PAGES
// (app/utils/info-pages.ts), copy in i18n under `pages.about`.
definePageMeta({ cdnCache: true, prefooter: true })

useInfoPageSeo('about')
</script>

<template>
  <InfoPage id="about" />
</template>
