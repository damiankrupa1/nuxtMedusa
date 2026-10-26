<script setup lang="ts">
import type { AppLinkTarget } from '~/types/link'

const { title, shopTheLookProductHandles } = useAppConfig()

// Hand-picked handles resolved to real products — see app.config.ts and the
// missing-cms-content skill for why this grouping is editorial curation.
// Falls back to this static list when Payload has no ShopTheLook global
// yet, none of its productHandles still resolve to a real Medusa product,
// or it's unreachable. Both are fetched in parallel (3 products either
// way) so neither path adds extra latency to the other.
const { data: shopTheLook } = useFetchShopTheLook()
const cms = computed(() => shopTheLook.value ?? null)

const fallbackResults = await Promise.all(
  (shopTheLookProductHandles as string[]).map((handle) =>
    useFetchProductByHandle(handle),
  ),
)
const fallbackProducts = computed(() =>
  fallbackResults.map((result) => result.data.value).filter((p) => p !== null),
)

const products = computed(() => cms.value?.products ?? fallbackProducts.value)

const total = computed(() =>
  products.value.reduce(
    (sum, product) => sum + (getCheapestVariantPriceAmount(product) || 0),
    0,
  ),
)
const currencyCode = computed(
  () =>
    products.value[0] &&
    getCheapestVariant(products.value[0])?.calculated_price?.currency_code,
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
  <section class="flex flex-col lg:flex-row">
    <div
      class="relative h-[420px] w-full lg:h-[760px] lg:w-[740px] lg:shrink-0"
    >
      <NuxtImg
        v-if="cms"
        :src="cms.image.url"
        :alt="cms.image.alt"
        sizes="100vw lg:51vw"
        class="size-full object-cover"
        loading="lazy"
      />
      <NuxtImg
        v-else
        src="/images/home/shop-the-look.jpg"
        :alt="$t('pages.home.shopTheLook.imageAlt')"
        width="1024"
        height="1024"
        sizes="100vw lg:51vw"
        class="size-full object-cover"
        loading="lazy"
      />
      <div
        class="absolute left-8 top-[30px] flex items-center gap-2.5 bg-color-paper px-3 py-2.5"
      >
        <span class="h-px w-[30px] bg-color-ink" />
        <p class="text-[10px] text-color-ink">
          {{
            cms?.captionLabel ??
            $t('pages.home.shopTheLook.captionLabel', { title })
          }}
        </p>
      </div>
      <p class="absolute bottom-10 left-8 text-[10px] text-color-ink">
        {{ cms?.bottomTagline ?? $t('pages.home.shopTheLook.bottomTagline') }}
      </p>
    </div>

    <div
      class="flex flex-1 flex-col gap-6 bg-color-accent px-6 py-10 lg:gap-[25px] lg:px-16 lg:py-[52px]"
    >
      <AppSectionIntro
        :eyebrow="cms?.eyebrow ?? $t('pages.home.shopTheLook.eyebrow')"
        size="lg"
        tone="dark"
      >
        <template #heading>
          <span class="block">{{
            cms?.headlineLine1 ?? $t('pages.home.shopTheLook.headlineLine1')
          }}</span>
          <span class="block">{{
            cms?.headlineLine2 ?? $t('pages.home.shopTheLook.headlineLine2')
          }}</span>
        </template>
        {{ cms?.description ?? $t('pages.home.shopTheLook.description') }}
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
          {{ cms?.shopSetCtaLabel ?? $t('pages.home.shopTheLook.shopSetCta') }}
        </AppButtonPrimary>
        <div class="flex flex-col items-end gap-1 text-right">
          <p class="text-[10px] text-color-sage">
            {{ cms?.totalLabel ?? $t('pages.home.shopTheLook.totalLabel') }}
          </p>
          <StoreLocalizedPrice
            :amount="total"
            :currency-code="currencyCode"
            class="text-[15px] text-color-paper"
          />
        </div>
      </div>

      <p class="text-[10px] text-color-sage">
        {{ cms?.sizeHint ?? $t('pages.home.shopTheLook.sizeHint') }}
      </p>
    </div>
  </section>
</template>
