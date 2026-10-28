// Payload doesn't send CORS headers for this storefront's origin, so the
// browser can't read it directly (server renders can, which hid this until a
// client-side navigation refetched). Proxying through Nitro keeps the request
// same-origin and lets the response be cached instead of hitting Payload on
// every page view.
const globalSlugs = new Set([
  'navigation',
  'footer-content',
  'studio-story',
  'brands',
  'journal-section',
  'campaign-slides',
  'category-tiles',
  'shop-the-look',
])

export default defineCachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, 'slug')
    const { payloadUrl } = useRuntimeConfig(event).public

    if (!slug || !globalSlugs.has(slug)) {
      throw createError({ statusCode: 404, message: 'Unknown CMS global' })
    }
    if (!payloadUrl) {
      throw createError({
        statusCode: 503,
        message: 'Payload CMS is not configured',
      })
    }

    const { locale, depth } = getQuery(event)
    const localeParam = typeof locale === 'string' ? locale : ''
    const depthParam = Number(depth)

    if (!/^[a-z]{2}(-[A-Za-z]{2})?$/.test(localeParam)) {
      throw createError({ statusCode: 400, message: 'Invalid locale' })
    }

    try {
      return await $fetch(`${payloadUrl}/api/globals/${slug}`, {
        query: {
          locale: localeParam,
          depth:
            Number.isInteger(depthParam) && depthParam >= 0 ? depthParam : 0,
        },
      })
    } catch (err) {
      console.error('Error while fetching Payload global', slug, err)
      throw createError({
        statusCode: 502,
        message: 'Payload CMS request failed',
      })
    }
  },
  { name: 'cms', maxAge: 60, staleMaxAge: 60 * 5, swr: true },
)
