<script setup lang="ts">
const accountLink = useCountryLink('/account')

const { status, data } = useFetchCustomer()

// Shown to guests once the customer lookup has answered, so a signed-in
// customer never sees it flash. TODO(#79): both links lead to the account
// page, which has the sign-in and the register form; the list itself stays in
// this browser until the backend wishlist exists (medusaDemo#26).
const isGuest = computed(
  () => status.value === 'success' && !data.value?.customer,
)
</script>

<template>
  <section
    v-if="isGuest"
    class="bg-color-sand"
    :aria-label="$t('pages.wishlist.account.heading')"
  >
    <UContainer
      class="flex flex-col gap-6 py-9 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="flex flex-col gap-[9px]">
        <p
          class="font-serif text-[26px] leading-tight text-color-ink lg:text-[32px]"
        >
          {{ $t('pages.wishlist.account.heading') }}
        </p>
        <p class="text-xs leading-normal text-color-muted">
          {{ $t('pages.wishlist.account.text') }}
        </p>
      </div>
      <div class="flex items-center gap-6">
        <NuxtLink
          v-if="accountLink"
          :to="accountLink"
          class="border border-color-ink px-[30px] py-[15px] text-[11px] leading-none text-color-ink outline-offset-2 hover:bg-color-ink hover:text-color-paper focus-visible:outline-2 focus-visible:outline-(--color-ink)"
        >
          {{ $t('pages.wishlist.account.signIn') }}
        </NuxtLink>
        <NuxtLink
          v-if="accountLink"
          :to="accountLink"
          class="text-[11px] leading-none text-color-ink outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--color-ink)"
        >
          {{ $t('pages.wishlist.account.register') }}
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </UContainer>
  </section>
</template>
