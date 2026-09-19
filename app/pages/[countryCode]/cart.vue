<script setup lang="ts">
const { t } = useI18n()

const { data: cartResponse } = await useFetchCart()
const cart = computed(() => cartResponse.value?.cart || undefined)

const isCartEmpty = computed(() => cart.value?.items?.length === 0)

useSeoMeta({
  title: t('pages.cart.title'),
  robots: 'noindex',
})
</script>

<template>
  <UContainer class="py-12">
    <div>
      <div
        class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-x-20 xl:gap-x-40"
      >
        <div class="flex flex-col bg-white py-6 gap-y-6">
          <div class="flex flex-col gap-y-3">
            <AppHeading as="h1">
              {{ $t('pages.cart.heading') }}
            </AppHeading>
            <ClientOnly>
              <CartEmpty v-if="isCartEmpty" />
              <CartTable v-else-if="cart" :cart="cart" />
              <CartTableSkeleton v-else />
              <template #fallback>
                <CartTableSkeleton />
              </template>
            </ClientOnly>
          </div>
        </div>
        <div class="relative">
          <div class="flex flex-col gap-y-8 sticky top-12">
            <div class="bg-white py-6">
              <ClientOnly>
                <CartSummary
                  v-if="!isCartEmpty"
                  :title="$t('pages.cart.summary')"
                  :cart="cart"
                />
                <template #fallback>
                  <CartSummary
                    :title="$t('pages.cart.summary')"
                    :cart="undefined"
                  />
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
