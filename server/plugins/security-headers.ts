import {
  buildSecurityHeaders,
  isErrorPageRequest,
} from '~~/server/utils/security-headers'

// The security headers of every response (#90; values and reasons in
// server/utils/security-headers.ts): X-Content-Type-Options, Referrer-Policy
// and Permissions-Policy. frame-ancestors is server/plugins/frame-ancestors.ts.
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

    Object.entries(buildSecurityHeaders()).forEach(([name, value]) => {
      if (getResponseHeader(event, name) === undefined) {
        setResponseHeader(event, name, value)
      }
    })
  })
})
