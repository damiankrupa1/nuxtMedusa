// Lets the CDN share the HTML of pages that render the same for every visitor
// (marked by app/plugins/cdn-cache.server.ts) for a minute, then refresh it in
// the background. Redirects, errors and responses that set a cookie are
// visitor-specific, so they are never shared.
const CDN_CACHE_CONTROL = 'max-age=60, stale-while-revalidate=300'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    const status = response.statusCode ?? event.node.res.statusCode
    if (
      !event.context.cdnCache ||
      status !== 200 ||
      event.node.res.hasHeader('set-cookie')
    ) {
      return
    }

    response.headers = {
      ...response.headers,
      'cdn-cache-control': CDN_CACHE_CONTROL,
    }
  })
})
