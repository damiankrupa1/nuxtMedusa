<script lang="ts" setup>
import type { StoreCartResponse } from '@medusajs/types'

const { data: cartResponse } = useNuxtData<StoreCartResponse>('cart')
const cart = computed(() => cartResponse.value?.cart)

const countries = await useCountries()

function getCountryName(countryCode?: string) {
  if (!countryCode) return
  return countries.value?.find((country) => country.iso_2 === countryCode)
    ?.display_name
}

const sameAsBilling = computed(() => {
  return compareAddresses(
    cart.value?.shipping_address,
    cart.value?.billing_address,
  )
})
</script>

<template>
  <div v-if="cart" class="flex items-start gap-x-8 text-sm">
    <div class="flex items-start gap-x-1 w-full">
      <div class="flex flex-col w-1/3">
        <div class="font-semibold text-black mb-1">
          {{ $t('checkout.summary.shippingAddress') }}
        </div>
        <div>
          {{ cart.shipping_address?.first_name }}
          {{ cart.shipping_address?.last_name }}
        </div>
        <div>
          {{ cart.shipping_address?.address_1 }}
          {{ cart.shipping_address?.address_2 }}
        </div>
        <div>
          {{ cart.shipping_address?.postal_code }},
          {{ cart.shipping_address?.city }}
        </div>
        <div>
          {{ getCountryName(cart.shipping_address?.country_code) }}
        </div>
      </div>

      <div class="flex flex-col w-1/3">
        <div class="font-semibold text-black mb-1">
          {{ $t('checkout.summary.contact') }}
        </div>
        <div>
          {{ cart.shipping_address?.phone }}
        </div>
        <div>
          {{ cart.email }}
        </div>
      </div>

      <div class="flex flex-col w-1/3">
        <div class="font-semibold text-black mb-1">
          {{ $t('checkout.summary.billingAddress') }}
        </div>

        <div v-if="sameAsBilling">
          {{ $t('checkout.summary.billingSameNote') }}
        </div>
        <div v-else>
          <div>
            {{ cart.billing_address?.first_name }}
            {{ cart.billing_address?.last_name }}
          </div>
          <div>
            {{ cart.billing_address?.address_1 }}
            {{ cart.billing_address?.address_2 }}
          </div>
          <div>
            {{ cart.billing_address?.postal_code }}
            {{ cart.billing_address?.city }}
          </div>
          <div>
            {{ getCountryName(cart.billing_address?.country_code) }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else>{{ $t('pages.orderConfirmed.loading') }}</div>
</template>
