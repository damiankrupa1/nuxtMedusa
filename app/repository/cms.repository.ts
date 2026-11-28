import type { z } from 'zod'
import type {
  CmsBrands,
  CmsCampaignSlides,
  CmsCategoryTiles,
  CmsFooterContent,
  CmsGlobalSlug,
  CmsInfoPage,
  CmsInfoPageSlug,
  CmsJournalSection,
  CmsNavigation,
  CmsShopTheLook,
  CmsStudioStory,
} from '~/types/cms'
import type { CmsPreviewRequest } from '~/types/preview'
import {
  cmsBrandsSchema,
  cmsCampaignSlidesSchema,
  cmsCategoryTilesSchema,
  cmsFooterContentSchema,
  cmsInfoPageSchema,
  cmsJournalSectionSchema,
  cmsNavigationSchema,
  cmsShopTheLookSchema,
  cmsStudioStorySchema,
} from '~/types/cms'
import { PREVIEW_TOKEN_HEADER } from '~/types/preview'
import { createPreviewUnauthorizedError } from '~/utils/preview'
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

// The draft of a global, for the draft preview only (#53, "Draft preview" in
// CLAUDE.md): from /api/preview/cms/<slug>, which is never cached, with the
// token in the x-preview-token header. Browser only: the server never renders
// a draft. Without a token (the preview expired) nothing is fetched, and
// never the published version instead, so the editor can't mistake it for
// the draft. A 401 is thrown as a new error (without the request, which
// carries the token) for the composable to end the preview. A draft that
// doesn't match the schema isn't reported: drafts may be saved with required
// fields still empty, and the published path reports a real contract change.
async function fetchDraftGlobal<Schema extends z.ZodType>(
  slug: CmsGlobalSlug,
  schema: Schema,
  locale: string,
  depth: number,
  token: string | null,
): Promise<z.output<Schema> | null> {
  if (import.meta.server || !token) return null

  let response: unknown
  try {
    response = await $fetch(`/api/preview/cms/${slug}`, {
      query: { locale, depth },
      headers: { [PREVIEW_TOKEN_HEADER]: token },
      cache: 'no-store',
    })
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode === 401) throw createPreviewUnauthorizedError()
    // As in fetchGlobal(): an answer was reported by the server. Without one,
    // a new error with no cause, since the fetch error carries the token.
    if (statusCode === undefined) {
      captureError(new Error(`Payload draft of "${slug}" got no answer`), {
        source: 'payload',
        global: slug,
        draft: true,
      })
    }
    return null
  }

  const result = schema.safeParse(response)
  return result.success ? result.data : null
}

// Payload's REST API is public read-only today, but it sends no CORS headers
// for the storefront, so the browser can't call it. The request goes through
// the server/api/cms proxy, which forwards it to Payload; callers below don't
// care. With `preview`, the draft is fetched instead (fetchDraftGlobal()).
async function fetchGlobal<Schema extends z.ZodType>(
  slug: CmsGlobalSlug,
  schema: Schema,
  locale: string,
  // depth 0 leaves relationships (e.g. an image upload) as a bare Media id;
  // callers whose type includes a CmsImage/upload relationship must pass a
  // depth of at least 1 so Payload returns the populated url/alt instead.
  depth = 0,
  preview?: CmsPreviewRequest,
): Promise<z.output<Schema> | null> {
  const {
    public: { payloadUrl },
  } = useRuntimeConfig()
  if (!payloadUrl) return null

  if (preview) {
    return fetchDraftGlobal(slug, schema, locale, depth, preview.token)
  }

  // CMS content is non-critical chrome (nav/footer, home sections); a Payload
  // outage or a global that doesn't match its schema must not break page
  // rendering, so both are turned into "no content" here rather than rethrown
  // for the composable to deal with.
  let response: unknown
  try {
    response = await $fetch(`/api/cms/${slug}`, {
      query: { locale, depth },
    })
  } catch (error) {
    // An answer from the proxy (its 502, 400, 404, 503) was already reported
    // by the server: payloadRepository() for a Payload failure, Sentry's
    // Nitro hook for any other 5xx. Reporting it here too would double it.
    // That relies on the server always reporting, so turning off
    // `enableNitroErrorHandler` would make these failures invisible. Without
    // an answer (network, offline, abort) the server never saw the request,
    // so only this side can report it.
    if ((error as { statusCode?: number }).statusCode === undefined) {
      captureError(error, { source: 'payload', global: slug })
    }
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
    async fetchNavigation(
      locale: string,
      preview?: CmsPreviewRequest,
    ): Promise<CmsNavigation | null> {
      return fetchGlobal('navigation', cmsNavigationSchema, locale, 0, preview)
    },
    async fetchFooterContent(
      locale: string,
      preview?: CmsPreviewRequest,
    ): Promise<CmsFooterContent | null> {
      return fetchGlobal(
        'footer-content',
        cmsFooterContentSchema,
        locale,
        0,
        preview,
      )
    },
    async fetchStudioStory(
      locale: string,
      preview?: CmsPreviewRequest,
    ): Promise<CmsStudioStory | null> {
      return fetchGlobal(
        'studio-story',
        cmsStudioStorySchema,
        locale,
        1,
        preview,
      )
    },
    async fetchBrands(
      locale: string,
      preview?: CmsPreviewRequest,
    ): Promise<CmsBrands | null> {
      return fetchGlobal('brands', cmsBrandsSchema, locale, 0, preview)
    },
    async fetchJournalSection(
      locale: string,
      preview?: CmsPreviewRequest,
    ): Promise<CmsJournalSection | null> {
      return fetchGlobal(
        'journal-section',
        cmsJournalSectionSchema,
        locale,
        1,
        preview,
      )
    },
    async fetchCampaignSlides(
      locale: string,
      preview?: CmsPreviewRequest,
    ): Promise<CmsCampaignSlides | null> {
      return fetchGlobal(
        'campaign-slides',
        cmsCampaignSlidesSchema,
        locale,
        1,
        preview,
      )
    },
    async fetchCategoryTiles(
      locale: string,
      preview?: CmsPreviewRequest,
    ): Promise<CmsCategoryTiles | null> {
      return fetchGlobal(
        'category-tiles',
        cmsCategoryTilesSchema,
        locale,
        1,
        preview,
      )
    },
    async fetchShopTheLook(
      locale: string,
      preview?: CmsPreviewRequest,
    ): Promise<CmsShopTheLook | null> {
      return fetchGlobal(
        'shop-the-look',
        cmsShopTheLookSchema,
        locale,
        1,
        preview,
      )
    },
    // `null` for a page with no published copy (Payload's `{}`) as well as for
    // a failure: either way the page answers 404, there is no fallback.
    async fetchInfoPage(
      slug: CmsInfoPageSlug,
      locale: string,
      preview?: CmsPreviewRequest,
    ): Promise<CmsInfoPage | null> {
      return fetchGlobal(slug, cmsInfoPageSchema, locale, 0, preview)
    },
  }
}
