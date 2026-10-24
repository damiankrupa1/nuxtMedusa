<script lang="ts" setup>
const { title } = useAppConfig()
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
      <p>{{ $t('app.footer.contact.email') }}</p>
      <p>{{ $t('app.footer.contact.phone') }}</p>
      <p class="text-[10px]">{{ $t('app.footer.contact.hours') }}</p>
    </div>
    <div class="flex items-center gap-x-5">
      <UIcon name="i-simple-icons-instagram" class="size-[19px] text-color-paper" />
      <UIcon name="i-simple-icons-facebook" class="size-[18px] text-color-paper" />
      <span class="text-[11px] text-[#dbddd3]">
        {{ $t('app.footer.social.handle') }}
      </span>
    </div>
  </div>
</template>
