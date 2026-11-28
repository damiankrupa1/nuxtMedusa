<script setup lang="ts">
// Information page (#107): route, status and sections in INFO_PAGES
// (app/utils/info-pages.ts), copy in i18n under `pages.journal`. The articles
// are the Payload `journal-section` global, the same as on the home page;
// without it the list is left out (no stand-in articles).
definePageMeta({ cdnCache: true, prefooter: true })

useInfoPageSeo('journal')
</script>

<template>
  <InfoPage id="journal" />
</template>
