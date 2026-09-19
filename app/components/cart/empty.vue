<template>
  <div>
    <p class="font-medium text-sm mt-4 mb-6 max-w-[32rem] text-neutral-900">
      {{ $t('cart.empty.message') }}
    </p>
    <div>
      <AppLinkButton to="/store" class="pl-0">
        {{ $t('cart.empty.cta') }}
      </AppLinkButton>
    </div>
  </div>
</template>
