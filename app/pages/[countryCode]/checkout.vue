<script lang="ts" setup>
definePageMeta({
  layout: 'checkout',
})

const { t } = useI18n()

const { data: cartResponse } = await useFetchCart()
const cart = computed(() => cartResponse.value?.cart || undefined)

useSeoMeta({
  title: t('pages.checkout.title'),
  robots: 'noindex',
})
</script>

<template>
  <UContainer class="py-12">
    <div class="grid grid-cols-1 sm:grid-cols-[1fr_416px] gap-x-40">
      <CheckoutForm />
      <CartSummary
        :title="$t('pages.checkout.cartHeading')"
        :cart="cart"
        is-checkout
      />
    </div>
  </UContainer>
</template>
