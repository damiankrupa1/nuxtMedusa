import { isPreviewRequest } from '~~/server/utils/preview'

// Lets the CDN share the HTML of pages that render the same for every visitor
// (marked by app/plugins/cdn-cache.server.ts) for a minute, then refresh it in
// the background. Redirects, errors and responses that set a cookie are
// visitor-specific, so they are never shared, and neither is a preview
// request (?preview, see server/plugins/preview.ts), even though its render
// is the published content.
const CDN_CACHE_CONTROL = 'max-age=60, stale-while-revalidate=300'

// Nuxt renders its error page as a request of its own to this route, and that
// render reports status 200 here: the real status (500, 404) is only applied
// to the response that carries it afterwards, which this hook never sees. The
// page plugin doesn't mark an error render, this is the second line of defense.
const ERROR_PAGE_PATH = '/__nuxt_error'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    const status = response.statusCode ?? event.node.res.statusCode
    if (
      !event.context.cdnCache ||
      status !== 200 ||
      event.path.split('?')[0]?.endsWith(ERROR_PAGE_PATH) ||
      event.node.res.hasHeader('set-cookie') ||
      isPreviewRequest(event.path)
    ) {
      return
    }

    response.headers = {
      ...response.headers,
      'cdn-cache-control': CDN_CACHE_CONTROL,
    }
  })
})
