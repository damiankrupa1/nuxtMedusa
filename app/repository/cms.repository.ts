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
import { shouldReportOnce } from '~/utils/report-once'

// A global that doesn't match its schema fails on every render and every
// client-side navigation until someone fixes it in Payload, so each distinct
// failure is reported once per server instance / page load. The event carries
// the zod issues as paths, codes and messages only (zod leaves the received
// values out), so it says which field is wrong without carrying any content.
function reportInvalidGlobal(slug: CmsGlobalSlug, error: z.ZodError) {
  const issues = error.issues.map(({ code, path, message }) => ({
    code,
    path: path.join('.') || '(root)',
    message,
  }))
  const signature = issues.map(({ path, code }) => `${path}:${code}`).join('|')
  if (!shouldReportOnce(`payload:${slug}:${signature}`)) {
    return
  }

  const first = issues[0]
  captureError(
    new Error(
      `Payload global "${slug}" doesn't match its schema (${first?.path}: ${first?.message})`,
      { cause: error },
    ),
    { source: 'payload', global: slug, type: 'invalid_response', issues },
  )
}

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
    reportInvalidGlobal(slug, result.error)
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
