import type {
  CmsBrands,
  CmsCampaignSlides,
  CmsCategoryTiles,
  CmsFooterContent,
  CmsGlobalSlug,
  CmsJournalSection,
  CmsNavigation,
  CmsShopTheLook,
  CmsStudioStory,
} from '~/types/cms'

// Payload's REST API is public read-only today, but it sends no CORS headers
// for the storefront, so the browser can't call it. The request goes through
// the server/api/cms proxy, which forwards it to Payload (and is where an API
// key or draft-preview secret would go); callers below don't care.
async function fetchGlobal<T>(
  slug: CmsGlobalSlug,
  locale: string,
  // depth 0 leaves relationships (e.g. an image upload) as a bare Media id;
  // callers whose type includes a CmsImage/upload relationship must pass a
  // depth of at least 1 so Payload returns the populated url/alt instead.
  depth = 0,
): Promise<T | null> {
  const {
    public: { payloadUrl },
  } = useRuntimeConfig()
  if (!payloadUrl) return null

  try {
    return await $fetch<T>(`/api/cms/${slug}`, {
      query: { locale, depth },
    })
  } catch (error) {
    // CMS content is non-critical chrome (nav/footer); a Payload outage must
    // not break page rendering, so the error is reported and swallowed here
    // rather than rethrown for the composable to deal with.
    captureError(error, { source: 'payload', global: slug })
    return null
  }
}

export function cmsRepository() {
  return {
    async fetchNavigation(locale: string): Promise<CmsNavigation | null> {
      return fetchGlobal<CmsNavigation>('navigation', locale)
    },
    async fetchFooterContent(locale: string): Promise<CmsFooterContent | null> {
      return fetchGlobal<CmsFooterContent>('footer-content', locale)
    },
    async fetchStudioStory(locale: string): Promise<CmsStudioStory | null> {
      return fetchGlobal<CmsStudioStory>('studio-story', locale, 1)
    },
    async fetchBrands(locale: string): Promise<CmsBrands | null> {
      return fetchGlobal<CmsBrands>('brands', locale)
    },
    async fetchJournalSection(
      locale: string,
    ): Promise<CmsJournalSection | null> {
      return fetchGlobal<CmsJournalSection>('journal-section', locale, 1)
    },
    async fetchCampaignSlides(
      locale: string,
    ): Promise<CmsCampaignSlides | null> {
      return fetchGlobal<CmsCampaignSlides>('campaign-slides', locale, 1)
    },
    async fetchCategoryTiles(locale: string): Promise<CmsCategoryTiles | null> {
      return fetchGlobal<CmsCategoryTiles>('category-tiles', locale, 1)
    },
    async fetchShopTheLook(locale: string): Promise<CmsShopTheLook | null> {
      return fetchGlobal<CmsShopTheLook>('shop-the-look', locale, 1)
    },
  }
}
