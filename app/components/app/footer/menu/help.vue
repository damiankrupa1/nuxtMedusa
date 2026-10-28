<script lang="ts" setup>
const { data: footerContent } = useFetchFooterContent()
</script>

<template>
  <div v-if="footerContent?.helpLinks.length" class="flex flex-col gap-y-5">
    <p class="text-[10px] text-color-paper">
      {{ $t('app.footer.help.heading') }}
    </p>
    <ul class="flex flex-col gap-y-5 text-xs text-color-sage">
      <li v-for="link in footerContent.helpLinks" :key="link.url">
        <AppLink :to="link.url">{{ link.label }}</AppLink>
      </li>
    </ul>
  </div>
</template>
