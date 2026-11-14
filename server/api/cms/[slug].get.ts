import { payloadRepository } from '~~/server/repository/payload.repository'
import { isCmsGlobalSlug, parseCmsGlobalQuery } from '~~/server/utils/cms'

// Payload doesn't send CORS headers for this storefront's origin, so the
// browser can't read it directly (server renders can, which hid this until a
// client-side navigation refetched). Proxying through Nitro keeps the request
// same-origin and lets the response be cached instead of hitting Payload on
// every page view. Not wrapped in defineWrappedResponseHandler: that one maps
// Medusa errors, and there are none here. The handler only does HTTP (slug,
// config, query, cache); the Payload call, its timeout and the 502 mapping
// live in server/repository/payload.repository.ts. A Payload failure is
// reported once, there, and its 502 carries the reported error as `cause` so
// Sentry's Nitro hook doesn't report it again.
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

    return payloadRepository(payloadUrl).fetchGlobal(slug, query)
  },
  { name: 'cms', maxAge: 60, staleMaxAge: 60 * 5, swr: true },
)
