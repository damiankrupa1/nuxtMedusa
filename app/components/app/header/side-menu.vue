<script setup lang="ts">
const isOpen = defineModel<boolean>()
const { title } = useAppConfig()
const { country } = useCountry()
const { t } = useI18n()

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
          <AppLink to="/" @click="isOpen = false">
            {{ $t('app.header.home') }}
          </AppLink>
          <AppLink to="/store" @click="isOpen = false">
            {{ $t('app.header.store') }}
          </AppLink>
          <AppLink to="/account" @click="isOpen = false">
            {{ $t('app.header.account') }}
          </AppLink>
          <AppLink to="/cart" @click="isOpen = false">
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
