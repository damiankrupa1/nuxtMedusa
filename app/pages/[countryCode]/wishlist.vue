<script setup lang="ts">
// Not cdnCache: the list is per visitor and lives in the browser, so the
// server renders only the frame and the data arrives on the client.
definePageMeta({ prefooter: true })

const { t } = useI18n()

// Personal and empty on the server: kept out of the index, the sitemap and
// (like cart and account) robots.txt, and without canonical/hreflang.
useSeoMeta({
  title: t('pages.wishlist.title'),
  ogTitle: t('pages.wishlist.title'),
  description: t('pages.wishlist.description'),
  robots: 'noindex',
})

const { loaded, productIds } = useWishlist()
const { items, status, error, refresh } = useFetchWishlistProducts()

const isLoading = computed(
  () =>
    !loaded.value ||
    (productIds.value.length > 0 &&
      (status.value === 'idle' || status.value === 'pending') &&
      items.value.length === 0),
)
const hasFailed = computed(() => loaded.value && !!error.value)
const isEmpty = computed(
  () =>
    loaded.value &&
    !error.value &&
    !isLoading.value &&
    items.value.length === 0,
)
</script>

<template>
  <div>
    <UContainer class="pt-[26px]">
      <nav
        :aria-label="$t('pages.wishlist.breadcrumb')"
        class="flex items-center gap-2.5 text-[10px]"
      >
        <AppLink to="/" class="text-color-muted">
          {{ $t('app.header.home') }}
        </AppLink>
        <span class="text-color-muted" aria-hidden="true">/</span>
        <span class="text-color-muted" aria-current="page">
          {{ $t('pages.wishlist.title') }}
        </span>
      </nav>

      <AppSectionIntro
        as="h1"
        size="lg"
        :eyebrow="$t('pages.wishlist.eyebrow')"
        :heading="$t('pages.wishlist.heading')"
        class="items-center pb-10 pt-8 text-center"
      >
        {{ $t('pages.wishlist.lead') }}
      </AppSectionIntro>
    </UContainer>

    <section class="bg-white" :aria-label="$t('pages.wishlist.saved')">
      <UContainer class="flex flex-col gap-7 pb-14 pt-7">
        <div
          class="flex items-center justify-between gap-4 border-b border-color-line pb-6"
        >
          <h2 class="text-base leading-normal text-color-ink">
            {{ $t('pages.wishlist.saved') }}
            <template v-if="!isLoading && !hasFailed">
              ({{ items.length }})
            </template>
          </h2>
          <!--
            TODO(#79): "Ostatnio dodane" is the only order the design shows, so
            it is a label, not a control. More sort options need a decision.
          -->
          <p class="text-[11px] leading-normal text-color-muted">
            {{ $t('pages.wishlist.sort') }}
            <span class="text-color-ink">{{
              $t('pages.wishlist.sortRecent')
            }}</span>
          </p>
        </div>

        <ul
          v-if="isLoading"
          class="grid grid-cols-2 gap-5 lg:grid-cols-4"
          :aria-label="$t('pages.wishlist.loading')"
          aria-busy="true"
        >
          <li v-for="n in 4" :key="n" class="flex flex-col gap-4">
            <USkeleton class="aspect-[4/5] w-full rounded-none" />
            <USkeleton class="h-3 w-1/3 rounded-none" />
            <USkeleton class="h-4 w-4/5 rounded-none" />
            <USkeleton class="h-4 w-1/4 rounded-none" />
          </li>
        </ul>

        <div v-else-if="hasFailed" class="flex flex-col items-start gap-4">
          <AppStatusMessage
            type="error"
            :message="$t('pages.wishlist.error')"
          />
          <AppButtonPrimary @click="refresh()">
            {{ $t('pages.wishlist.retry') }}
          </AppButtonPrimary>
        </div>

        <!-- TODO(#79): the design has no empty state; this one is a proposal. -->
        <div
          v-else-if="isEmpty"
          class="flex flex-col items-center gap-4 py-12 text-center"
        >
          <UIcon name="i-lucide-heart" class="size-8 text-color-muted" />
          <p class="font-serif text-[32px] leading-tight text-color-ink">
            {{ $t('pages.wishlist.empty.title') }}
          </p>
          <p class="max-w-[420px] text-[13px] leading-[1.7] text-color-muted">
            {{ $t('pages.wishlist.empty.text') }}
          </p>
          <AppButtonPrimary to="/store" trailing-icon="i-lucide-arrow-right">
            {{ $t('pages.wishlist.empty.link') }}
          </AppButtonPrimary>
        </div>

        <template v-else>
          <ul class="grid grid-cols-2 gap-5 lg:grid-cols-4">
            <li
              v-for="item in items"
              :key="item.productId"
              class="flex min-w-0"
            >
              <WishlistItem v-if="item.product" :product="item.product" />
              <WishlistUnavailableItem v-else :product-id="item.productId" />
            </li>
          </ul>
          <div class="flex justify-center pt-2.5">
            <AppLink
              to="/store"
              class="text-xs text-color-ink underline underline-offset-2 hover:no-underline"
            >
              {{ $t('pages.wishlist.discover') }}
              <span aria-hidden="true">→</span>
            </AppLink>
          </div>
        </template>
      </UContainer>
    </section>

    <WishlistAccountPrompt />
  </div>
</template>
