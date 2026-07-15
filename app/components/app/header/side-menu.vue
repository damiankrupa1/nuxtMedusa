<script setup lang="ts">
const isOpen = defineModel<boolean>()
const { title } = useAppConfig()

const countries = await useCountries()
const { country } = useCountry()
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    side="left"
    title="Menu"
    description="Navigation menu"
  >
    <template #body>
      <div class="h-full min-h-48 flex flex-col justify-between">
        <div class="flex flex-col space-y-4">
          <AppLink to="/" @click="isOpen = false"> Home </AppLink>
          <AppLink to="/store" @click="isOpen = false"> Store </AppLink>
          <AppLink to="/account" @click="isOpen = false"> Account </AppLink>
          <AppLink to="/cart" @click="isOpen = false"> Cart </AppLink>
        </div>
        <div>
          <div class="flex items-center justify-between cursor-pointer group">
            <div class="text-xs flex items-center space-x-2">
              <span>Shipping to:</span>
              <UIcon :name="`i-flag-${country?.iso_2}-4x3`" />
              <span>{{ country?.display_name }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <p class="text-xs text-color-muted">
        © 2026 {{ title }}. All rights reserved.
      </p>
    </template>
  </USlideover>
</template>
