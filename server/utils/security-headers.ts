import type { HeaderPolicy } from '~/types/security'

// The response headers server/plugins/security-headers.ts sends on every
// response (#90), next to the `frame-ancestors` policy of
// server/plugins/frame-ancestors.ts, which stays where it is. Everything here
// depends on the runtime config only, never on the request, so a page the CDN
// shares (cdnCache) carries the same headers for every visitor: no nonce, no
// per-request value.

// Nuxt renders its error page as a request of its own to this route and then
// copies that response's headers onto the real one. Left alone, so the
// stricter headers Nitro's error handler puts on the error (no-referrer) are
// not overwritten by ours. Same check as server/plugins/cdn-cache.ts.
const ERROR_PAGE_PATH = '/__nuxt_error'

// strict-origin-when-cross-origin is what browsers do by default; sent so it
// holds whatever the browser's default is: a request to Medusa, Stripe or
// InPost carries our origin only, never the path or query (`?q=`, the
// Przelewy24 return's client secret). Draft preview responses keep their own
// `no-referrer` (server/utils/preview.ts) and Nitro's error responses theirs.
export const REFERRER_POLICY = 'strict-origin-when-cross-origin'

// The InPost Geowidget (app/components/checkout/delivery/inpost/picker.vue)
// renders its map in an iframe of this origin, with
// `allow="geolocation 'self' <this origin>/index.html"` for its "near me"
// button (read from https://geowidget.inpost.pl/inpost-geowidget.js).
export const INPOST_GEOWIDGET_APP = 'https://geowidget-app.inpost.pl'

// Browser features the storefront doesn't use, switched off for the page and
// every frame in it. Geolocation stays for the InPost map frame only (a
// frame can be granted a feature only when the page itself has it, hence
// `self`). Not listed, so they keep the browser default: `payment` and
// `publickey-credentials-get`, which Stripe's frames (3D Secure, Link) may
// ask for and which can't be tried without Stripe keys. Only features
// Chromium knows: it reports an unknown name as a console error.
export const PERMISSIONS_POLICY: HeaderPolicy = {
  accelerometer: [],
  bluetooth: [],
  'browsing-topics': [],
  camera: [],
  'display-capture': [],
  geolocation: ['self', INPOST_GEOWIDGET_APP],
  gyroscope: [],
  hid: [],
  magnetometer: [],
  microphone: [],
  midi: [],
  serial: [],
  usb: [],
}

/** `feature=()`, `feature=(self "https://origin")`, comma-separated. */
export function serializePermissionsPolicy(policy: HeaderPolicy): string {
  return Object.entries(policy)
    .map(([feature, allowlist]) => {
      const origins = allowlist.map((origin) =>
        origin === 'self' ? origin : `"${origin}"`,
      )
      return `${feature}=(${origins.join(' ')})`
    })
    .join(', ')
}

/** Every header the plugin sends, by lower-case name. */
export function buildSecurityHeaders(): Record<string, string> {
  return {
    'x-content-type-options': 'nosniff',
    'referrer-policy': REFERRER_POLICY,
    'permissions-policy': serializePermissionsPolicy(PERMISSIONS_POLICY),
  }
}

/** Whether a request (h3's `event.path`) is Nuxt's error page render. */
export function isErrorPageRequest(path: string | undefined): boolean {
  return (path ?? '').split('?')[0]?.endsWith(ERROR_PAGE_PATH) ?? false
}
