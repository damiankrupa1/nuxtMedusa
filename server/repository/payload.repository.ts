import type { CmsGlobalQuery, CmsGlobalSlug } from '~/types/cms'

export const PAYLOAD_REQUEST_TIMEOUT_MS = 5_000

// The only place that knows Payload's REST layout (`/api/globals/<slug>`).
// Normalises the base URL, bounds the request and turns every upstream
// failure (a 404 from Payload included) into a 502 for the storefront. It
// doesn't log or report: cms.repository.ts's fetchGlobal() receives the 502
// and reports it once. The body is returned as received; it is validated
// there, with the zod schema of the global.
export function payloadRepository(baseUrl: string) {
  const apiUrl = `${baseUrl.replace(/\/+$/, '')}/api`

  return {
    async fetchGlobal(
      slug: CmsGlobalSlug,
      query: CmsGlobalQuery,
    ): Promise<unknown> {
      try {
        return await $fetch(`${apiUrl}/globals/${slug}`, {
          query,
          signal: AbortSignal.timeout(PAYLOAD_REQUEST_TIMEOUT_MS),
        })
      } catch (error) {
        const upstreamStatus = (error as { statusCode?: number }).statusCode
        throw createError({
          statusCode: 502,
          message: `Payload CMS request failed (${upstreamStatus ?? 'no response'})`,
        })
      }
    },
  }
}
