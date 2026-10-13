<script lang="ts" setup>
import type { StoreCartResponse } from '@medusajs/types'

const { data: cartResponse } = useNuxtData<StoreCartResponse>('cart')
const cart = computed(() => cartResponse.value?.cart)

const inpostPoint = computed(() =>
  getInpostPoint(cart.value?.shipping_methods?.at(-1)?.data),
)
const inpostPointAddress = computed(() =>
  inpostPoint.value ? formatInpostPointAddress(inpostPoint.value) : '',
)
</script>

<template>
  <div
    v-if="!!cart?.shipping_methods?.at(-1)?.shipping_option_id"
    class="flex flex-col w-1/3"
  >
    <div class="font-semibold text-black mb-1">
      {{ $t('checkout.summary.method') }}
    </div>
    <div>
      {{ cart.shipping_methods?.at(-1)?.name }}
      (<StoreLocalizedPrice
        :amount="cart.shipping_methods?.at(-1)?.amount"
        :currency-code="cart?.currency_code"
      />)
    </div>
    <template v-if="inpostPoint">
      <div>
        {{
          $t('checkout.delivery.inpost.selectedPoint', {
            name: inpostPoint.name,
          })
        }}
      </div>
      <div v-if="inpostPointAddress">{{ inpostPointAddress }}</div>
    </template>
  </div>
</template>
