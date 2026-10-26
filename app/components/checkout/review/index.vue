<script lang="ts" setup>
const {
  stripeMethod,
  cardContainer,
  cardComplete,
  cardError,
  blikCode,
  loading,
  error,
  disabled,
  mutate: placeOrder,
} = useCartPayment()
</script>

<template>
  <div>
    <div class="mb-6 text-sm">
      {{ $t('checkout.review.termsIntro') }}
      <strong>{{ $t('checkout.review.termsOfUse') }}</strong
      >,
      <strong>{{ $t('checkout.review.termsOfSale') }}</strong>
      {{ $t('auth.register.and') }}
      <strong>{{ $t('checkout.review.returnsPolicy') }}</strong>
      {{ $t('checkout.review.privacyPolicyAck') }}
      <strong>{{ $t('checkout.review.privacyPolicy') }}</strong
      >.
    </div>

    <div v-if="stripeMethod === 'card'" class="mb-6">
      <h3 class="text-sm font-medium mb-2">
        {{ $t('checkout.review.creditCardInfo') }}
      </h3>
      <div
        ref="cardContainer"
        class="p-4 border rounded-lg border-neutral-200 bg-white"
      />
      <!--
        Inline field feedback, so plain text like UFormField's error rather
        than AppStatusMessage. The regions stay mounted so they announce;
        600/700 shades keep 4.5:1 contrast, which --ui-error/--ui-success don't.
      -->
      <div role="alert">
        <p v-if="cardError" class="mt-2 text-sm text-error-600">
          {{ cardError }}
        </p>
      </div>
      <div role="status">
        <p
          v-if="!cardError && cardComplete"
          class="mt-2 text-sm text-success-700"
        >
          {{ $t('checkout.review.cardComplete') }}
        </p>
      </div>
    </div>

    <div v-else-if="stripeMethod === 'blik'" class="mb-6 max-w-xs">
      <AppInput
        v-model="blikCode"
        name="blik_code"
        :label="$t('checkout.review.blikCode')"
        autocomplete="one-time-code"
        inputmode="numeric"
        maxlength="6"
        required
        :disabled="loading"
      />
      <p class="mt-2 text-sm text-neutral-500">
        {{
          loading
            ? $t('checkout.review.blikConfirmInApp')
            : $t('checkout.review.blikCodeHint')
        }}
      </p>
    </div>

    <p v-else-if="stripeMethod === 'p24'" class="mb-6 text-sm">
      {{ $t('checkout.review.p24Redirect') }}
    </p>

    <AppStatusMessage
      type="error"
      :message="error ? $t('checkout.review.paymentErrorTitle') : null"
      :description="error"
      class="mb-6"
    />

    <UButton
      class="cursor-pointer"
      color="neutral"
      size="xl"
      :disabled="disabled"
      :loading="loading"
      @click="placeOrder"
    >
      {{ $t('checkout.review.placeOrder') }}
    </UButton>
  </div>
</template>
