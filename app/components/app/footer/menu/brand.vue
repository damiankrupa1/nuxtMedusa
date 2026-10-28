<script lang="ts" setup>
const { title } = useAppConfig()

const { data: footerContent } = useFetchFooterContent()
</script>

<template>
  <div class="flex flex-col gap-y-[22px] w-full md:w-[315px] shrink-0">
    <AppLink
      to="/"
      class="text-[28px] md:text-[33px] font-medium text-color-paper"
    >
      {{ title }}
    </AppLink>
    <p
      class="font-serif text-2xl md:text-[26px] leading-[1.2] text-color-paper"
    >
      {{ $t('app.footer.tagline') }}
    </p>
    <div
      v-if="footerContent?.contact"
      class="flex flex-col gap-y-2 text-color-sage text-xs"
    >
      <p v-if="footerContent.contact.email">
        {{ footerContent.contact.email }}
      </p>
      <p v-if="footerContent.contact.phone">
        {{ footerContent.contact.phone }}
      </p>
      <p v-if="footerContent.contact.hours" class="text-[10px]">
        {{ footerContent.contact.hours }}
      </p>
    </div>
    <div class="flex items-center gap-x-5">
      <UIcon
        name="i-simple-icons-instagram"
        class="size-[19px] text-color-paper"
      />
      <UIcon
        name="i-simple-icons-facebook"
        class="size-[18px] text-color-paper"
      />
      <span v-if="footerContent?.social" class="text-[11px] text-color-sage">
        {{ footerContent.social.handle }}
      </span>
    </div>
  </div>
</template>
