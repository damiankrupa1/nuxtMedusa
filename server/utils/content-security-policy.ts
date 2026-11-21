import type {
  HeaderPolicy,
  SecurityHeadersRuntimeConfigInput,
} from '~/types/security'
import { INPOST_GEOWIDGET_APP } from '~~/server/utils/security-headers'

// The Content-Security-Policy-Report-Only of every response (#90), sent by
// server/plugins/security-headers.ts. Report-only: the browser enforces
// nothing and only reports (in the console, and to NUXT_CSP_REPORT_URI when
// set). The enforced Content-Security-Policy stays the `frame-ancestors` of
// server/plugins/frame-ancestors.ts; this is a second, separate header, so it
// never relaxes or replaces that one, nor the draft preview's.
//
// Built from the runtime config only, never from the request: a page the CDN
// shares (cdnCache) carries the same policy for every visitor, so no nonce.

// The InPost Geowidget's script and stylesheet
// (app/components/checkout/delivery/inpost/picker.vue); its map is an iframe
// of INPOST_GEOWIDGET_APP, which also inserts a <style> into our page.
const INPOST_GEOWIDGET = 'https://geowidget.inpost.pl'

// Stripe.js, as listed in Stripe's integration security guide
// (docs.stripe.com/security/guide, "Content Security Policy" > Stripe.js):
// script and frames from js.stripe.com and *.js.stripe.com (frames on other
// origins), API calls to api.stripe.com, and hooks.stripe.com for the
// 3D Secure frame. maps.googleapis.com is only needed for the Address Element
// with our own Maps key, which we don't use.
const STRIPE_JS = ['https://js.stripe.com', 'https://*.js.stripe.com']
const STRIPE_API = 'https://api.stripe.com'
const STRIPE_HOOKS = 'https://hooks.stripe.com'

// The fixed part of the policy. The hosts that depend on the environment
// (Medusa, Payload, Sentry, image hosts, the report target) are added by
// buildContentSecurityPolicy().
//
// 'unsafe-inline' in script-src is there for Nuxt's two inline scripts
// (`window.__NUXT__` with the public runtime config, and the import map) and
// is the first thing to tighten before the policy is enforced: replace it
// with their sha256 hashes. Both are the same on every page of a deployment
// (they change with the build and the public runtime config), so a hash
// works on CDN cached pages, where a nonce per request can't. 'unsafe-inline'
// in style-src is for Nuxt UI's <style> tags, Vue's `style` bindings and the
// Geowidget's own <style>; that one is likely to stay.
//
// Not here because browsers ignore them in a report-only policy (and log
// that): frame-ancestors, upgrade-insecure-requests, sandbox.
export const CSP_DIRECTIVES: HeaderPolicy = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", ...STRIPE_JS, INPOST_GEOWIDGET],
  'style-src': ["'self'", "'unsafe-inline'", INPOST_GEOWIDGET],
  // data: for the icons, which Nuxt Icon draws as CSS masks of data: SVGs
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'", STRIPE_API],
  'frame-src': [...STRIPE_JS, STRIPE_HOOKS, INPOST_GEOWIDGET_APP],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

// The name the report target gets in Reporting-Endpoints and report-to
export const CSP_REPORT_GROUP = 'csp-endpoint'

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]']
const HOST_SOURCE = /^(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)*(:\d{1,5})?$/

function parseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/** The origin of an http(s) URL, or null. */
function toOrigin(value: string | undefined): string | null {
  const url = parseUrl(value?.trim() ?? '')
  if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
    return null
  }
  return url.origin
}

/**
 * One entry of a configured host list as a CSP source: an http(s) URL becomes
 * its origin, a bare host name (`cdn.example.com`, `*.example.com`, with an
 * optional port) stays as it is. Anything else (`*`, `https:`, a keyword,
 * something with a space or a semicolon) is dropped, so a typo in a variable
 * can't widen the policy beyond one host.
 */
export function toCspHostSource(value: string): string | null {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  if (trimmed.includes('://')) return toOrigin(trimmed)
  return HOST_SOURCE.test(trimmed) ? trimmed : null
}

/** A comma-separated host list as CSP sources, invalid entries left out. */
export function parseCspHostSources(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map(toCspHostSource)
    .filter((source): source is string => source !== null)
}

/**
 * NUXT_CSP_REPORT_URI when it can be used as a report target: https, or
 * plain http on localhost (a local collector), no credentials, nothing that
 * would break the header (whitespace, `;`, `,`, quotes). Else null, and no
 * report is sent anywhere.
 */
export function parseCspReportUri(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || /[\s;,"'`]/.test(trimmed)) return null

  const url = parseUrl(trimmed)
  if (!url || url.username || url.password) return null
  const secure =
    url.protocol === 'https:' ||
    (url.protocol === 'http:' && LOCAL_HOSTNAMES.includes(url.hostname))
  return secure ? url.href : null
}

/** `name src1 src2; name2 ...`, each source once, in the order given. */
export function serializeCsp(directives: HeaderPolicy): string {
  return Object.entries(directives)
    .map(([name, sources]) => [name, ...new Set(sources)].join(' '))
    .join('; ')
}

/**
 * The report-only policy of this deployment: the fixed directives plus
 * - connect-src: the Medusa backend (the page's own Store API calls) and the
 *   Sentry ingest host of the public DSN (the browser SDK's envelopes);
 * - img-src: the Medusa backend (its local file storage), the Payload origin
 *   and NUXT_PUBLIC_PAYLOAD_IMAGE_HOSTS (images @nuxt/image doesn't proxy are
 *   loaded from there), and NUXT_CSP_IMG_SRC (any other image host, e.g. the
 *   bucket of Medusa's S3 file storage);
 * - report-uri / report-to: NUXT_CSP_REPORT_URI, only when it is set.
 * Payload is deliberately not in connect-src: the browser reaches it only
 * through /api/cms (#42), so a direct call shows up as a violation.
 */
export function buildContentSecurityPolicy(
  runtimeConfig: SecurityHeadersRuntimeConfigInput,
): string {
  const { csp = {}, public: publicConfig } = runtimeConfig
  const medusa = toOrigin(publicConfig.medusa?.backendUrl)
  const payload = toOrigin(publicConfig.payloadUrl)
  const sentry = toOrigin(publicConfig.sentry?.dsn)
  const reportUri = parseCspReportUri(csp.reportUri)
  const present = (...values: (string | null)[]) =>
    values.filter((value): value is string => value !== null)

  return serializeCsp({
    ...CSP_DIRECTIVES,
    'img-src': [
      ...(CSP_DIRECTIVES['img-src'] ?? []),
      ...present(medusa, payload),
      ...parseCspHostSources(csp.payloadImageHosts),
      ...parseCspHostSources(csp.imgSrc),
    ],
    'connect-src': [
      ...(CSP_DIRECTIVES['connect-src'] ?? []),
      ...present(medusa, sentry),
    ],
    ...(reportUri && {
      'report-uri': [reportUri],
      'report-to': [CSP_REPORT_GROUP],
    }),
  })
}

/**
 * The report-only policy and, with a report target, the Reporting-Endpoints
 * header that report-to refers to, by lower-case header name.
 */
export function buildContentSecurityPolicyHeaders(
  runtimeConfig: SecurityHeadersRuntimeConfigInput,
): Record<string, string> {
  const reportUri = parseCspReportUri(runtimeConfig.csp?.reportUri)

  return {
    'content-security-policy-report-only':
      buildContentSecurityPolicy(runtimeConfig),
    ...(reportUri && {
      'reporting-endpoints': `${CSP_REPORT_GROUP}="${reportUri}"`,
    }),
  }
}
