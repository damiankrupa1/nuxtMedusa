// Keeps other sites from embedding the storefront in a frame (clickjacking on
// the cart, checkout and account pages): every response gets
// `Content-Security-Policy: frame-ancestors 'self'`, so only pages of this
// origin may frame it. frame-ancestors has no fallback to default-src, so this
// is a complete policy on its own and restricts nothing else (scripts, images,
// Stripe, InPost).
//
// It is a default set when the request arrives, not when the response is
// written, so it also covers API routes, errors, redirects and static assets,
// and it never touches the headers the CDN cache plugin looks at. A response
// that needs a different policy replaces it with setResponseHeader() and then
// owns the whole header, including frame-ancestors. The draft preview (#53)
// will do that with a list of origins (its own, Payload and the Medusa admin);
// don't append a second Content-Security-Policy to relax it, because browsers
// enforce every policy and the intersection with this one would still block
// the preview's frames.
//
// There is deliberately no X-Frame-Options: every current browser enforces
// frame-ancestors and ignores X-Frame-Options when it is present, so the old
// header would only be one more thing for the preview to override.
const FRAME_ANCESTORS_POLICY = "frame-ancestors 'self'"

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    // Another plugin or hook that ran first already chose a policy; keep it.
    if (getResponseHeader(event, 'content-security-policy') !== undefined) {
      return
    }

    setResponseHeader(event, 'content-security-policy', FRAME_ANCESTORS_POLICY)
  })
})
