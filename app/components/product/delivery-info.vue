<script setup lang="ts">
// TODO(#58): the free-shipping, carriers and returns copy is static i18n text
// (like the shopping-assurances bar); it moves to the ProductPageInfo Global
// (damiankrupa1/simple-landing-page-nuxt#28). TODO(#59): the 399 zł threshold
// is written into the copy and is repeated in the benefits bar.
//
// TODO(#59): the help line is a mailto: link to the footer contact e-mail;
// confirm it should not open a contact page. It needs an address, which only
// Payload has; without one the line is left out, like the footer's contact
// block.
const { data: footer } = useFetchFooterContent()
const email = computed(() => footer.value?.contact?.email ?? null)
</script>

<template>
  <div class="flex flex-col border-t border-color-line pt-5">
    <p class="text-xs leading-[1.5] text-color-ink">
      {{ $t('product.delivery.free') }}
    </p>
    <p class="mt-1.5 text-[11px] leading-[1.5] text-color-muted">
      {{ $t('product.delivery.carriers') }}
    </p>
    <p class="mt-5 text-xs leading-[1.5] text-color-ink">
      {{ $t('product.delivery.returns') }}
    </p>
    <p v-if="email" class="mt-6 text-[11px] leading-[1.5] text-color-muted">
      {{ $t('product.delivery.help') }}
      <a
        :href="`mailto:${email}`"
        class="underline underline-offset-2 outline-offset-2 hover:text-color-ink focus-visible:outline-2 focus-visible:outline-(--color-ink)"
      >
        {{ $t('product.delivery.helpLink') }}
      </a>
    </p>
  </div>
</template>
