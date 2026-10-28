<script setup lang="ts">
const isOpen = defineModel<boolean>()
const { title } = useAppConfig()
const { country } = useCountry()
const { t } = useI18n()

const { data: navigation } = useFetchNavigation()

const currentYear = new Date().getFullYear()
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    side="left"
    :title="t('app.sideMenu.title')"
    :description="t('app.sideMenu.description')"
  >
    <template #body>
      <div class="h-full min-h-48 flex flex-col justify-between">
        <div class="flex flex-col space-y-4">
          <template v-if="navigation?.primaryNav.length">
            <AppLink
              v-for="item in navigation.primaryNav"
              :key="item.url"
              :to="item.url"
              @click="isOpen = false"
            >
              {{ item.label }}
            </AppLink>
            <div class="h-px bg-color-line my-2" />
          </template>
          <AppLink
            to="/account"
            class="flex items-center gap-x-2"
            @click="isOpen = false"
          >
            <UIcon name="i-lucide-user-round" class="size-4" />
            {{ $t('app.header.account') }}
          </AppLink>
          <AppLink
            to="/cart"
            class="flex items-center gap-x-2"
            @click="isOpen = false"
          >
            <UIcon name="i-lucide-shopping-bag" class="size-4" />
            {{ $t('app.header.cart') }}
          </AppLink>
        </div>
        <div>
          <div class="flex items-center justify-between cursor-pointer group">
            <div class="text-xs flex items-center space-x-2">
              <span>{{ $t('app.header.shippingTo') }}</span>
              <UIcon :name="`i-flag-${country?.iso_2}-4x3`" />
              <span>{{ country?.display_name }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <p class="text-xs text-color-muted">
        {{ $t('app.footer.copyright', { year: currentYear, title }) }}
      </p>
    </template>
  </USlideover>
</template>
