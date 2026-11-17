import type { CmsGlobalQuery, CmsGlobalSlug } from '~/types/cms'
import type { PayloadDraftCredentials } from '~/types/preview'
import { captureError } from '~/utils/capture-error'

export const PAYLOAD_REQUEST_TIMEOUT_MS = 5_000

interface GlobalRequest {
  query: Record<string, string | number>
  headers?: Record<string, string>
  draft: boolean
}

// The only place that knows Payload's REST layout (`/api/globals/<slug>`).
// Normalises the base URL, bounds the request and turns every upstream
// failure (a 404 from Payload included) into a 502 for the storefront. It
// reports that failure once, here, and links the reported error as the 502's
// `cause`, so neither Sentry's Nitro hook nor cms.repository.ts's
// fetchGlobal() reports it again. The body is returned as received; it is
// validated on the app side, with the zod schema of the global.
function requestGlobal(baseUrl: string, slug: CmsGlobalSlug) {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/globals/${slug}`

  return async ({ query, headers, draft }: GlobalRequest): Promise<unknown> => {
    try {
      return await $fetch(url, {
        query,
        ...(headers && { headers }),
        signal: AbortSignal.timeout(PAYLOAD_REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      const upstreamStatus = (error as { statusCode?: number }).statusCode
      const kind = draft ? 'draft request' : 'request'
      const message = `Payload CMS ${kind} failed (${upstreamStatus ?? 'no response'})`

      // A plain Error without a `status`: isExpectedError() would turn an
      // upstream 404 into a breadcrumb, but a Payload 404 is our problem
      // (wrong URL or a missing global), not the shopper's.
      const cause = new Error(message, { cause: error })
      captureError(cause, {
        source: 'payload',
        global: slug,
        ...(draft && { draft: true }),
      })

      throw createError({ statusCode: 502, message, cause })
    }
  }
}

// The published content, for the public, cached server/api/cms proxy. It
// sends no credentials and builds the query itself from locale and depth
// only, so nothing a caller passes along can make Payload return a draft.
export function payloadRepository(baseUrl: string) {
  return {
    fetchGlobal(slug: CmsGlobalSlug, query: CmsGlobalQuery): Promise<unknown> {
      return requestGlobal(
        baseUrl,
        slug,
      )({
        query: { locale: query.locale, depth: query.depth },
        draft: false,
      })
    },
  }
}

// The latest draft, for the draft preview only (server/api/preview/cms, not
// cached). Payload returns drafts only to an authenticated caller: the
// storefront's `service-users` account, whose API key can read draft globals
// and nothing else. The key never leaves the server; it is not logged and not
// part of the reported error.
export function payloadDraftRepository(
  baseUrl: string,
  { apiKey, apiKeyCollection }: PayloadDraftCredentials,
) {
  return {
    fetchDraftGlobal(
      slug: CmsGlobalSlug,
      query: CmsGlobalQuery,
    ): Promise<unknown> {
      return requestGlobal(
        baseUrl,
        slug,
      )({
        query: { locale: query.locale, depth: query.depth, draft: 'true' },
        headers: { authorization: `${apiKeyCollection} API-Key ${apiKey}` },
        draft: true,
      })
    },
  }
}
