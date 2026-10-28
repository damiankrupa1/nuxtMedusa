import { isCmsGlobalSlug, parseCmsGlobalQuery } from '~~/server/utils/cms'

// Payload doesn't send CORS headers for this storefront's origin, so the
// browser can't read it directly (server renders can, which hid this until a
// client-side navigation refetched). Proxying through Nitro keeps the request
// same-origin and lets the response be cached instead of hitting Payload on
// every page view. Not wrapped in defineWrappedResponseHandler: that one maps
// Medusa errors, and there are none here. A Payload failure is reported
// once, by cms.repository.ts, which receives the 502.
export default defineCachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, 'slug')
    const { payloadUrl } = useRuntimeConfig(event).public

    if (!isCmsGlobalSlug(slug)) {
      throw createError({ statusCode: 404, message: 'Unknown CMS global' })
    }
    if (!payloadUrl) {
      throw createError({
        statusCode: 503,
        message: 'Payload CMS is not configured',
      })
    }

    // A 400 with the zod issues for an invalid locale/depth
    const query = parseCmsGlobalQuery(getQuery(event))

    try {
      return await $fetch(`${payloadUrl}/api/globals/${slug}`, { query })
    } catch (error) {
      const upstreamStatus = (error as { statusCode?: number }).statusCode
      throw createError({
        statusCode: 502,
        message: `Payload CMS request failed (${upstreamStatus ?? 'no response'})`,
      })
    }
  },
  { name: 'cms', maxAge: 60, staleMaxAge: 60 * 5, swr: true },
)
