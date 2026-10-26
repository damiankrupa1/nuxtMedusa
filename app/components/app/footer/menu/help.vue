<script lang="ts" setup>
// Falls back to these when Payload has no FooterContent global yet (or is
// unreachable) — see missing-cms-content skill.
const fallbackLinks = [
  { labelKey: 'app.footer.help.shippingAndPayments', to: '/store' },
  { labelKey: 'app.footer.help.returns', to: '/store' },
  { labelKey: 'app.footer.help.sizeGuide', to: '/store' },
  { labelKey: 'app.footer.help.trackOrder', to: '/store' },
  { labelKey: 'app.footer.help.faq', to: '/store' },
]

const { data: footerContent } = useFetchFooterContent()
const links = computed(() => footerContent.value?.helpLinks ?? null)
</script>

<template>
  <div class="flex flex-col gap-y-5">
    <p class="text-[10px] text-color-paper">
      {{ $t('app.footer.help.heading') }}
    </p>
    <ul class="flex flex-col gap-y-5 text-xs text-color-sage">
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
