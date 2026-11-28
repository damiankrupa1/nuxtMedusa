<script setup lang="ts">
// Information page (#107, #121): route, status and structure in INFO_PAGES
// (app/utils/info-pages.ts), copy in the page's Payload global. A page with
// no published copy answers 404 (see useInfoPage()).
definePageMeta({ cdnCache: true, prefooter: true })

const { content, ready, notFoundWhenMissing } = useInfoPage('cookies')
await ready
notFoundWhenMissing()
</script>

<template>
  <InfoPage id="cookies" :content="content" />
</template>
