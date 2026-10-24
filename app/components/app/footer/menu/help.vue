<script lang="ts" setup>
// TODO: no support/FAQ content model exists in this codebase — fully
// mocked links, see missing-cms-content skill.
</script>

<template>
  <div class="flex flex-col gap-y-5">
    <p class="text-[10px] text-color-paper">
      {{ $t('app.footer.help.heading') }}
    </p>
    <ul class="flex flex-col gap-y-5 text-xs text-[#dbddd3]">
      <li><AppLink to="/store">{{ $t('app.footer.help.shippingAndPayments') }}</AppLink></li>
      <li><AppLink to="/store">{{ $t('app.footer.help.returns') }}</AppLink></li>
      <li><AppLink to="/store">{{ $t('app.footer.help.sizeGuide') }}</AppLink></li>
      <li><AppLink to="/store">{{ $t('app.footer.help.trackOrder') }}</AppLink></li>
      <li><AppLink to="/store">{{ $t('app.footer.help.faq') }}</AppLink></li>
    </ul>
  </div>
</template>
