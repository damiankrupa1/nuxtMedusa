import { buildContentSecurityPolicyHeaders } from '~~/server/utils/content-security-policy'
import {
  buildSecurityHeaders,
  isErrorPageRequest,
} from '~~/server/utils/security-headers'

// The security headers of every response (#90; values and reasons in
// server/utils/security-headers.ts and content-security-policy.ts):
// X-Content-Type-Options, Referrer-Policy, Permissions-Policy and the
// Content-Security-Policy-Report-Only. The enforced frame-ancestors policy is
// server/plugins/frame-ancestors.ts. The report-only policy is not sent by
// `nuxt dev` (Vite's client and the devtools would only add noise); check a
// new source with a production build (`pnpm build && pnpm preview`, or the
// e2e suite).
//
// Like frame-ancestors, a default set when the request arrives, so it also
// covers API routes, errors, redirects and Nitro's static asset handler, and
// it never touches the CDN cache header, cookies or the status. A header that
// is already there is kept: this plugin loads after preview.ts (plugins load
// in file order), whose request hook has given a preview response its own
// `Referrer-Policy: no-referrer` by then. Headers written later win anyway:
// the preview's beforeResponse and render:response hooks, and Nitro's error
// handler, which puts `no-referrer` (and its own nosniff) on errors. Nuxt's
// error page render (/__nuxt_error) is skipped, because Nuxt copies that
// response's headers onto the error response and would replace Nitro's
// stricter values with these.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    if (isErrorPageRequest(event.path)) return

    const headers = {
      ...buildSecurityHeaders(),
      ...(!import.meta.dev &&
        buildContentSecurityPolicyHeaders(useRuntimeConfig(event))),
    }
    Object.entries(headers).forEach(([name, value]) => {
      if (getResponseHeader(event, name) === undefined) {
        setResponseHeader(event, name, value)
      }
    })
  })
})
