import type { H3Event } from 'h3'

import {
  applyPreviewHeaders,
  buildPreviewHeaders,
  isPreviewRequest,
  PREVIEW_STRIPPED_HEADERS,
  resolvePreviewConfig,
} from '~~/server/utils/preview'

// Central guard of the draft preview (#53): every response to a preview
// request (a route under /api/preview, or a page with ?preview) is private,
// no-store and noindex, carries no CDN cache header and, while the preview is
// configured, the preview's frame-ancestors. Whether the request is a preview
// one is decided by the URL alone, not by a valid token. The preview routes
// set the same headers themselves; this plugin also covers what they don't
// write (redirects, errors, unknown /api/preview paths) and the page renders.
//
// Set three times on purpose, each independent of the others: when the
// request arrives (so errors and redirects have them), before an API answer
// is sent and when a page has been rendered (after server/plugins/cdn-cache.ts
// and any handler could have added a CDN header). It runs after
// frame-ancestors.ts (plugins load in file order), so its policy replaces the
// default instead of being kept out by it.
const previewConfig = (event: H3Event) =>
  resolvePreviewConfig(useRuntimeConfig(event), { dev: import.meta.dev })

export default defineNitroPlugin((nitroApp) => {
  const guard = (event: H3Event) => {
    if (isPreviewRequest(event.path)) {
      applyPreviewHeaders(event, previewConfig(event))
    }
  }

  nitroApp.hooks.hook('request', guard)
  nitroApp.hooks.hook('beforeResponse', guard)

  nitroApp.hooks.hook('render:response', (response, { event }) => {
    if (!isPreviewRequest(event.path)) return

    const config = previewConfig(event)
    const previewHeaders = buildPreviewHeaders(
      config.enabled ? config.frameAncestors : undefined,
    )
    // Compared in lower case: a same-named header in another case would
    // otherwise be sent next to the preview one
    const replaced = new Set<string>([
      ...PREVIEW_STRIPPED_HEADERS,
      ...Object.keys(previewHeaders),
    ])
    const kept = Object.fromEntries(
      Object.entries(response.headers ?? {}).filter(
        ([name]) => !replaced.has(name.toLowerCase()),
      ),
    )

    response.headers = { ...kept, ...previewHeaders }
    applyPreviewHeaders(event, config)
  })
})
