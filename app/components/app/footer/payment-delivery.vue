<script lang="ts" setup>
// TODO: no composable lists enabled payment/shipping providers — Stripe
// wiring (app/repository/stripe.repository.ts) covers card/BLIK/Przelewy24
// but not a "which providers are enabled" query, and InPost/DPD are only
// wired for the parcel-locker picker, not a generic carrier list. Fully
// static trust badges for now, see missing-medusa-api-data skill.
const paymentProviders = ['BLIK', 'VISA', 'Mastercard', 'PayPo', 'Przelewy24']
const deliveryProviders = ['InPost', 'DPD']
</script>

<template>
  <div
    class="flex flex-col sm:flex-row gap-y-4 items-start sm:items-center justify-between border-t border-[rgba(250,248,244,0.19)] pt-[26px] text-color-paper"
  >
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
      <span class="text-[10px] text-color-sage">
        {{ $t('app.footer.paymentLabel') }}
      </span>
      <span
        v-for="provider in paymentProviders"
        :key="provider"
        class="text-xs font-semibold"
      >
        {{ provider }}
      </span>
    </div>
    <div class="flex flex-wrap items-center gap-x-5">
      <span class="text-[10px] text-color-sage">
        {{ $t('app.footer.deliveryLabel') }}
      </span>
      <span
        v-for="provider in deliveryProviders"
        :key="provider"
        class="text-sm font-medium"
      >
        {{ provider }}
      </span>
    </div>
  </div>
</template>
