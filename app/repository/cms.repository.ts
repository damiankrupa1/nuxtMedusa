import type { z } from 'zod'
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
import {
  cmsBrandsSchema,
  cmsCampaignSlidesSchema,
  cmsCategoryTilesSchema,
  cmsFooterContentSchema,
  cmsJournalSectionSchema,
  cmsNavigationSchema,
  cmsShopTheLookSchema,
  cmsStudioStorySchema,
} from '~/types/cms'

// Payload's REST API is public read-only today, but it sends no CORS headers
// for the storefront, so the browser can't call it. The request goes through
// the server/api/cms proxy, which forwards it to Payload (and is where an API
// key or draft-preview secret would go); callers below don't care.
async function fetchGlobal<Schema extends z.ZodType>(
  slug: CmsGlobalSlug,
  schema: Schema,
  locale: string,
  // depth 0 leaves relationships (e.g. an image upload) as a bare Media id;
  // callers whose type includes a CmsImage/upload relationship must pass a
  // depth of at least 1 so Payload returns the populated url/alt instead.
  depth = 0,
): Promise<z.output<Schema> | null> {
  const {
    public: { payloadUrl },
  } = useRuntimeConfig()
  if (!payloadUrl) return null

  // CMS content is non-critical chrome (nav/footer, home sections); a Payload
  // outage or a global that doesn't match its schema must not break page
  // rendering, so both are reported and turned into "no content" here rather
  // than rethrown for the composable to deal with.
  let response: unknown
  try {
    response = await $fetch(`/api/cms/${slug}`, {
      query: { locale, depth },
    })
  } catch (error) {
    captureError(error, { source: 'payload', global: slug })
    return null
  }

  const result = schema.safeParse(response)
  if (!result.success) {
    captureError(result.error, {
      source: 'payload',
      global: slug,
      type: 'invalid_response',
    })
    return null
  }

  return result.data
}

export function cmsRepository() {
  return {
    async fetchNavigation(locale: string): Promise<CmsNavigation | null> {
      return fetchGlobal('navigation', cmsNavigationSchema, locale)
    },
    async fetchFooterContent(locale: string): Promise<CmsFooterContent | null> {
      return fetchGlobal('footer-content', cmsFooterContentSchema, locale)
    },
    async fetchStudioStory(locale: string): Promise<CmsStudioStory | null> {
      return fetchGlobal('studio-story', cmsStudioStorySchema, locale, 1)
    },
    async fetchBrands(locale: string): Promise<CmsBrands | null> {
      return fetchGlobal('brands', cmsBrandsSchema, locale)
    },
    async fetchJournalSection(
      locale: string,
    ): Promise<CmsJournalSection | null> {
      return fetchGlobal('journal-section', cmsJournalSectionSchema, locale, 1)
    },
    async fetchCampaignSlides(
      locale: string,
    ): Promise<CmsCampaignSlides | null> {
      return fetchGlobal('campaign-slides', cmsCampaignSlidesSchema, locale, 1)
    },
    async fetchCategoryTiles(locale: string): Promise<CmsCategoryTiles | null> {
      return fetchGlobal('category-tiles', cmsCategoryTilesSchema, locale, 1)
    },
    async fetchShopTheLook(locale: string): Promise<CmsShopTheLook | null> {
      return fetchGlobal('shop-the-look', cmsShopTheLookSchema, locale, 1)
    },
  }
}
