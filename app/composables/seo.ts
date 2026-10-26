import type { StoreProduct } from '@medusajs/types'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { BaseRegionCountryWithRegionId } from '~/utils/country'

// Canonical URL + one hreflang alternate per country (from the regions the
// region middleware already loaded) for an indexable page. The site URL comes
// from NUXT_PUBLIC_SITE_URL (nuxt-site-config), falling back to the request
// origin; nothing here reads cookies, so CDN-cached pages stay shareable.
// `enabled` is false on a by-handle page whose handle matched nothing, so its
// 404 doesn't advertise itself as canonical.
export const useCountrySeoLinks = (
  enabled: MaybeRefOrGetter<boolean> = true,
) => {
  const route = useRoute()
  const siteConfig = useSiteConfig()
  const { defaultCountry } = useAppConfig()
  const { data: countries } =
    useNuxtData<BaseRegionCountryWithRegionId[]>('countries')

  const links = computed(() => {
    if (!toValue(enabled)) return []

    return buildCountryLinks({
      siteUrl: siteConfig.url ?? '',
      path: route.path,
      page: route.query.page,
      countryCodes: toCountryCodes(countries.value),
      defaultCountry,
    })
  })

  const canonicalUrl = computed(
    () => links.value.find((link) => link.rel === 'canonical')?.href,
  )

  useHead({ link: links })
  useSeoMeta({ ogUrl: canonicalUrl })

  return { canonicalUrl }
}

// schema.org Product JSON-LD for the product page, in the page's region
// currency (see buildProductJsonLd)
export const useProductJsonLd = (
  product: Ref<StoreProduct | null | undefined>,
  canonicalUrl: Ref<string | undefined>,
) => {
  const jsonLd = computed(() =>
    product.value && canonicalUrl.value
      ? buildProductJsonLd(product.value, canonicalUrl.value)
      : null,
  )

  useHead({
    script: computed(() =>
      jsonLd.value
        ? [
            {
              key: 'product-jsonld',
              type: 'application/ld+json',
              innerHTML: serializeJsonLd(jsonLd.value),
            },
          ]
        : [],
    ),
  })
}
