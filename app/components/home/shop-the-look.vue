<script setup lang="ts">
import type { AppLinkTarget } from '~/types/link'

// Payload supplies the editorial copy, image and product handles; the
// products themselves (prices, totals) are resolved live from Medusa by the
// CMS service, which drops handles that no longer match a real product.
const { data: shopTheLook } = useFetchShopTheLook()

const products = computed(() => shopTheLook.value?.products ?? [])

const total = computed(() =>
  products.value.reduce(
    (sum, product) => sum + (getCheapestVariantPriceAmount(product) ?? 0),
    0,
  ),
)
const currencyCode = computed(
  () =>
    (products.value[0] &&
      getCheapestVariant(products.value[0])?.calculated_price?.currency_code) ??
    null,
)

// No "buy the whole look" bulk-add-to-cart action exists — see
// missing-medusa-api-data skill. Links to the first piece's page instead.
const shopSetLink = computed<AppLinkTarget>(() =>
  products.value[0]?.handle
    ? {
        name: 'countryCode-products-handle',
        params: { handle: products.value[0].handle },
      }
    : '/store',
)
</script>

<template>
  <section v-if="shopTheLook" class="flex flex-col lg:flex-row">
    <div
      class="relative h-[420px] w-full lg:h-[760px] lg:w-[740px] lg:shrink-0"
    >
      <NuxtImg
        :src="shopTheLook.image.url"
        :alt="shopTheLook.image.alt"
        sizes="100vw lg:51vw"
        class="size-full object-cover"
        loading="lazy"
      />
      <div
        class="absolute left-8 top-[30px] flex items-center gap-2.5 bg-color-paper px-3 py-2.5"
      >
        <span class="h-px w-[30px] bg-color-ink" />
        <p class="text-[10px] text-color-ink">
          {{ shopTheLook.captionLabel }}
        </p>
      </div>
      <p class="absolute bottom-10 left-8 text-[10px] text-color-ink">
        {{ shopTheLook.bottomTagline }}
      </p>
    </div>

    <div
      class="flex flex-1 flex-col gap-6 bg-color-accent px-6 py-10 lg:gap-[25px] lg:px-16 lg:py-[52px]"
    >
      <AppSectionIntro :eyebrow="shopTheLook.eyebrow" size="lg" tone="dark">
        <template #heading>
          <span class="block">{{ shopTheLook.headlineLine1 }}</span>
          <span class="block">{{ shopTheLook.headlineLine2 }}</span>
        </template>
        {{ shopTheLook.description }}
      </AppSectionIntro>

      <div class="flex flex-col">
        <AppLink
          v-for="(product, index) in products"
          :key="product.id"
          :to="{
            name: 'countryCode-products-handle',
            params: { handle: product.handle },
          }"
          class="flex items-center gap-[18px] border-t border-[rgba(250,248,244,0.24)] py-[18px]"
        >
          <p class="font-serif text-2xl text-color-sage lg:text-[26px]">
            {{ String(index + 1).padStart(2, '0') }}
          </p>
          <p class="flex-1 text-[13px] text-color-paper">{{ product.title }}</p>
          <StoreLocalizedPrice
            :amount="getCheapestVariantPriceAmount(product)"
            :currency-code="
              getCheapestVariant(product)?.calculated_price?.currency_code
            "
            class="text-xs text-color-paper"
          />
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-4 shrink-0 text-color-paper"
          />
        </AppLink>
      </div>

      <div class="flex items-center justify-between">
        <AppButtonPrimary
          :to="shopSetLink"
          inverted
          trailing-icon="i-lucide-arrow-right"
        >
          {{ shopTheLook.shopSetCtaLabel }}
        </AppButtonPrimary>
        <div class="flex flex-col items-end gap-1 text-right">
          <p class="text-[10px] text-color-sage">
            {{ shopTheLook.totalLabel }}
          </p>
          <StoreLocalizedPrice
            :amount="total"
            :currency-code="currencyCode"
            class="text-[15px] text-color-paper"
          />
        </div>
      </div>

      <p class="text-[10px] text-color-sage">
        {{ shopTheLook.sizeHint }}
      </p>
    </div>
  </section>
</template>
