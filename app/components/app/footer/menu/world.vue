<script lang="ts" setup>
// Falls back to these when Payload has no FooterContent global yet (or is
// unreachable) — see missing-cms-content skill. "Journal" points at the
// home page's journal section anchor until a real article route exists.
const fallbackLinks = [
  { labelKey: 'app.footer.world.about', to: '/store' },
  { labelKey: 'app.footer.world.studio', to: '/store' },
  { labelKey: 'app.footer.world.journal', to: '/#journal' },
  { labelKey: 'app.footer.world.materials', to: '/store' },
  { labelKey: 'app.footer.world.careers', to: '/store' },
]

const { data: footerContent } = useFetchFooterContent()
const links = computed(() => footerContent.value?.worldLinks ?? null)
</script>

<template>
  <div class="flex flex-col gap-y-5">
    <p class="text-[10px] text-color-paper">
      {{ $t('app.footer.world.heading') }}
    </p>
    <ul class="flex flex-col gap-y-5 text-xs text-[#dbddd3]">
      <template v-if="links">
        <li v-for="link in links" :key="link.url">
          <AppLink :to="link.url">{{ link.label }}</AppLink>
        </li>
      </template>
      <template v-else>
        <li v-for="link in fallbackLinks" :key="link.labelKey">
          <AppLink :to="link.to">{{ $t(link.labelKey) }}</AppLink>
        </li>
      </template>
    </ul>
  </div>
</template>
