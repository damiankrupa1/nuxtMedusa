<script setup lang="ts">
// Information page (#107): route, status and sections in INFO_PAGES
// (app/utils/info-pages.ts), copy in i18n under `pages.faq`. The FAQPage
// JSON-LD is rendered by useInfoPageSeo() once the page is published.
definePageMeta({ cdnCache: true, prefooter: true })

useInfoPageSeo('faq')
</script>

<template>
  <InfoPage id="faq" />
</template>
