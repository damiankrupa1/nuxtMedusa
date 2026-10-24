<script lang="ts" setup>
const { title } = useAppConfig()

// Falls back to the i18n placeholders below when Payload has no
// FooterContent global yet (or is unreachable) — see missing-cms-content
// skill.
const { data: footerContent } = useFetchFooterContent()
const contact = computed(() => footerContent.value?.contact ?? null)
const social = computed(() => footerContent.value?.social ?? null)
</script>

<template>
  <div class="flex flex-col gap-y-[22px] w-full md:w-[315px] shrink-0">
    <AppLink to="/" class="text-[28px] md:text-[33px] font-medium text-color-paper">
      {{ title }}
    </AppLink>
    <p class="font-serif text-2xl md:text-[26px] leading-[1.2] text-color-paper">
      {{ $t('app.footer.tagline') }}
    </p>
    <div class="flex flex-col gap-y-2 text-[#dbddd3] text-xs">
      <template v-if="contact">
        <p>{{ contact.email }}</p>
        <p>{{ contact.phone }}</p>
        <p class="text-[10px]">{{ contact.hours }}</p>
      </template>
      <template v-else>
        <p>{{ $t('app.footer.contact.email') }}</p>
        <p>{{ $t('app.footer.contact.phone') }}</p>
        <p class="text-[10px]">{{ $t('app.footer.contact.hours') }}</p>
      </template>
    </div>
    <div class="flex items-center gap-x-5">
      <UIcon name="i-simple-icons-instagram" class="size-[19px] text-color-paper" />
      <UIcon name="i-simple-icons-facebook" class="size-[18px] text-color-paper" />
      <span class="text-[11px] text-[#dbddd3]">
        {{ social?.handle ?? $t('app.footer.social.handle') }}
      </span>
    </div>
  </div>
</template>
