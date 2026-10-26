<script lang="ts" setup>
const { title } = useAppConfig()

const { minimal } = defineProps<{
  minimal?: boolean
}>()

const currentYear = new Date().getFullYear()
const { country } = useCountry()
const currencyCode = computed(() => getMockCurrencyCode(country.value?.iso_2))

// TODO: no legal/policy pages exist in this codebase yet — fully mocked
// links, see missing-cms-content skill.
const legalLinks = [
  { labelKey: 'app.footer.legal.terms', to: '/store' },
  { labelKey: 'app.footer.legal.privacy', to: '/store' },
  { labelKey: 'app.footer.legal.cookies', to: '/store' },
  { labelKey: 'app.footer.legal.accessibility', to: '/store' },
]
</script>

<template>
  <div
    v-if="minimal"
    class="flex w-full text-color-dimmed text-xs py-4 justify-center"
  >
    <div class="flex gap-x-2 items-center">
      <div>{{ $t('app.footer.poweredBy') }}</div>
      <NuxtLink
        href="https://medusajs.com"
        target="_blank"
        class="hover:text-color-muted"
      >
        <UIcon name="i-simple-icons-medusa" class="size-5" />
      </NuxtLink>
      <span>&</span>
      <NuxtLink
        href="https://nuxt.com/"
        target="_blank"
        class="hover:text-color-muted"
      >
        <UIcon name="i-simple-icons-nuxtdotjs" class="size-6" />
      </NuxtLink>
    </div>
  </div>
  <div
    v-else
    class="flex flex-col sm:flex-row gap-y-2 w-full items-start sm:items-center justify-between text-[9px] text-color-sage"
  >
    <p>{{ $t('app.footer.copyright', { year: currentYear, title }) }}</p>
    <div class="flex flex-wrap gap-x-6">
      <AppLink v-for="link in legalLinks" :key="link.labelKey" :to="link.to">
        {{ $t(link.labelKey) }}
      </AppLink>
    </div>
    <p v-if="country" class="text-color-paper">
      {{ country.display_name }} · {{ currencyCode }} ↓
    </p>
  </div>
</template>
