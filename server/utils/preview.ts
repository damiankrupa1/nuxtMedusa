import type { H3Event } from 'h3'

import type {
  PreviewConfig,
  PreviewEntryQuery,
  PreviewRuntimeConfigInput,
  PreviewTokenClaims,
} from '~/types/preview'
import {
  PREVIEW_QUERY_PARAM,
  PREVIEW_TOKEN_FRAGMENT_PARAM,
} from '~/types/preview'
import { getLocaleFromCountryCode } from '~/utils/locale'
import { toCountryPath } from '~/utils/seo'

// Draft preview of Payload content (issue #53), the parts without the token
// check (that is server/utils/preview-token.ts). The rule behind all of it:
// the server never renders a draft and never stores one in any cache. Drafts
// are fetched only by the browser, from /api/preview/cms/<slug>, which is not
// cached; a page request with ?preview is a normal render of the published
// content that is kept out of the CDN.

export const PREVIEW_API_PREFIX = '/api/preview'

// HS256 needs a long random secret: Payload's preview link carries the token
// in its query string, so tokens end up in access logs, and a short secret
// could be brute-forced from one of them. Shorter secrets disable the preview.
export const PREVIEW_SECRET_MIN_LENGTH = 32

// Headers a shared cache would act on. Removed from every preview response,
// whatever set them (server/plugins/cdn-cache.ts, a route rule, a handler).
export const PREVIEW_STRIPPED_HEADERS = [
  'cdn-cache-control',
  'vercel-cdn-cache-control',
  'surrogate-control',
] as const

const API_KEY_COLLECTION = /^[a-z0-9-]{1,64}$/
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]']

/**
 * Whether a request (h3's `event.path`: path plus query) is a preview one: a
 * route under /api/preview or a page with a `preview` query parameter. Only
 * the presence counts, not whether a token is valid, so a broken or missing
 * token still gets no-store and noindex.
 */
export function isPreviewRequest(path: string | undefined): boolean {
  if (!path) return false

  const queryStart = path.indexOf('?')
  const rawPathname = queryStart === -1 ? path : path.slice(0, queryStart)
  let pathname = rawPathname
  try {
    pathname = decodeURIComponent(rawPathname)
  } catch {
    // A malformed escape: compare the raw path
  }
  pathname = pathname
    .toLowerCase()
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '')

  if (
    pathname === PREVIEW_API_PREFIX ||
    pathname.startsWith(`${PREVIEW_API_PREFIX}/`)
  ) {
    return true
  }

  return (
    queryStart !== -1 &&
    new URLSearchParams(path.slice(queryStart + 1)).has(PREVIEW_QUERY_PARAM)
  )
}

/**
 * The origin of `value` when it may be listed in frame-ancestors: https only
 * (plain http only for localhost, and only when `allowHttpLocalhost`), no
 * wildcard, no credentials. With `originOnly`, an entry with a path, query or
 * fragment is rejected instead of cut down to its origin, so a typo in the
 * list is not silently widened.
 */
function toFrameAncestor(
  value: string,
  { allowHttpLocalhost = false, originOnly = true } = {},
): string | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes('*')) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  const isLocal = LOCAL_HOSTNAMES.includes(url.hostname)
  const secure =
    url.protocol === 'https:' ||
    (url.protocol === 'http:' && isLocal && allowHttpLocalhost)
  if (!secure || url.username || url.password) return null
  if (originOnly && (url.pathname !== '/' || url.search || url.hash)) {
    return null
  }

  return url.origin
}

/**
 * Parses NUXT_PAYLOAD_PREVIEW_FRAME_ANCESTORS (comma-separated origins, the
 * Medusa admin hosts) into the origins that may frame a preview response.
 * Invalid entries are left out.
 */
export function parseFrameAncestors(
  value: string | undefined,
  { allowHttpLocalhost = false } = {},
): string[] {
  const origins = (value ?? '')
    .split(',')
    .map((entry) => toFrameAncestor(entry, { allowHttpLocalhost }))
    .filter((origin): origin is string => origin !== null)
  return [...new Set(origins)]
}

/**
 * The preview settings from the runtime config. Disabled (every /api/preview
 * route a 404) without a secret of at least PREVIEW_SECRET_MIN_LENGTH
 * characters, without an API key or with an invalid API key collection. The
 * frame ancestors are the Payload origin (the Live Preview pane) plus the
 * configured ones (the Medusa admin, which frames Payload: every ancestor of
 * a nested frame is checked).
 */
export function resolvePreviewConfig(
  runtimeConfig: PreviewRuntimeConfigInput,
  { dev = false } = {},
): PreviewConfig {
  const preview = runtimeConfig.payloadPreview ?? {}
  const secret = preview.secret ?? ''
  const apiKey = preview.apiKey?.trim() ?? ''
  const apiKeyCollection = preview.apiKeyCollection?.trim() || 'service-users'
  const payloadUrl = runtimeConfig.public.payloadUrl ?? ''

  const enabled =
    secret.length >= PREVIEW_SECRET_MIN_LENGTH &&
    apiKey !== '' &&
    API_KEY_COLLECTION.test(apiKeyCollection)

  const payloadOrigin = payloadUrl
    ? toFrameAncestor(payloadUrl, {
        allowHttpLocalhost: dev,
        originOnly: false,
      })
    : null
  const frameAncestors = [
    ...new Set([
      ...(payloadOrigin ? [payloadOrigin] : []),
      ...parseFrameAncestors(preview.frameAncestors, {
        allowHttpLocalhost: dev,
      }),
    ]),
  ]

  return {
    enabled,
    secret,
    apiKey,
    apiKeyCollection,
    payloadUrl,
    frameAncestors,
  }
}

/**
 * The headers of every preview response. `frameAncestors` is passed only when
 * the preview is enabled: the Content-Security-Policy then replaces the
 * default `frame-ancestors 'self'` (server/plugins/frame-ancestors.ts) as a
 * whole, it is never a second policy. Without it the default stays.
 */
export function buildPreviewHeaders(
  frameAncestors?: string[],
): Record<string, string> {
  return {
    'cache-control': 'private, no-store',
    'x-robots-tag': 'noindex, nofollow',
    'referrer-policy': 'no-referrer',
    ...(frameAncestors && {
      'content-security-policy': [
        "frame-ancestors 'self'",
        ...frameAncestors,
      ].join(' '),
    }),
  }
}

/** Sets the preview headers on the response and removes the CDN ones. */
export function applyPreviewHeaders(event: H3Event, config: PreviewConfig) {
  const headers = buildPreviewHeaders(
    config.enabled ? config.frameAncestors : undefined,
  )
  Object.entries(headers).forEach(([name, value]) =>
    setResponseHeader(event, name, value),
  )
  PREVIEW_STRIPPED_HEADERS.forEach((name) => removeResponseHeader(event, name))
}

/** Lets a preview route answer 404 while the preview is not configured. */
export function assertPreviewEnabled(config: PreviewConfig) {
  if (!config.enabled) {
    throw createError({ statusCode: 404, message: 'Not Found' })
  }
}

/**
 * Whether the token was issued for the global and locale of the entry link.
 * Payload always sets both claims; a token that names another one was not
 * made for this link.
 */
export function matchesPreviewEntry(
  claims: PreviewTokenClaims,
  query: PreviewEntryQuery,
): boolean {
  return (
    claims.locale === query.locale &&
    (query.global === undefined || claims.global === query.global)
  )
}

/**
 * The country whose pages are in the given content locale: `pl` for Polish,
 * the first other region country (by name) for English, the default country
 * when no region country matches (or no regions could be loaded).
 */
export function resolvePreviewCountry(
  locale: string,
  countryCodes: string[],
  defaultCountry: string,
): string {
  return (
    countryCodes.find(
      (countryCode) => getLocaleFromCountryCode(countryCode) === locale,
    ) ?? defaultCountry
  )
}

/**
 * Where the entry link redirects: the page with the preview marker, and the
 * token in the fragment, so the browser keeps it for the draft requests while
 * the page request itself carries no token.
 */
export function buildPreviewEntryLocation(
  countryCode: string,
  path: string,
  token: string,
): string {
  return `${toCountryPath(countryCode, path)}?${PREVIEW_QUERY_PARAM}=1#${PREVIEW_TOKEN_FRAGMENT_PARAM}=${encodeURIComponent(token)}`
}
