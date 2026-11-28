<script setup lang="ts">
// Information page (#107): route, status and sections in INFO_PAGES
// (app/utils/info-pages.ts), copy in i18n under `pages.trackOrder`. There is
// no order lookup here on purpose: a guest lookup needs backend support.
definePageMeta({ cdnCache: true, prefooter: true })

useInfoPageSeo('trackOrder')
</script>

<template>
  <InfoPage id="trackOrder" />
</template>
