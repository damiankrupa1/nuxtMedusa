import type { StoredPreviewSession } from '~/types/preview'
import {
  PAYLOAD_DOCUMENT_EVENT_MESSAGE,
  PREVIEW_CACHE_KEY_SUFFIX,
  PREVIEW_QUERY_PARAM,
  PREVIEW_STORAGE_KEY,
  PREVIEW_TOKEN_FRAGMENT_PARAM,
  previewTokenSchema,
  storedPreviewSessionSchema,
} from '~/types/preview'

// Browser-side helpers of the draft preview (#53, see "Draft preview" in
// CLAUDE.md). None of them sends the token anywhere.

/** The preview token handed over in the URL fragment (`#token=<JWT>`), or null. */
export function readPreviewTokenFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const token = previewTokenSchema.safeParse(
    params.get(PREVIEW_TOKEN_FRAGMENT_PARAM),
  )
  return token.success ? token.data : null
}

/**
 * `url` (absolute, or a path like vue-router's `history.state.current`)
 * without the token in its fragment. Any other fragment is kept.
 */
export function withoutPreviewToken(url: string): string {
  const hashStart = url.indexOf('#')
  if (hashStart === -1) return url

  const params = new URLSearchParams(url.slice(hashStart + 1))
  if (!params.has(PREVIEW_TOKEN_FRAGMENT_PARAM)) return url

  params.delete(PREVIEW_TOKEN_FRAGMENT_PARAM)
  const rest = params.toString()
  return `${url.slice(0, hashStart)}${rest ? `#${rest}` : ''}`
}

/**
 * Removes the token from the address bar without a navigation. vue-router
 * keeps the current path in `history.state.current` and writes it back into
 * the URL on its next navigation, so that is cleaned too; the rest of the
 * state stays.
 */
export function removePreviewTokenFromAddressBar(win: Window) {
  const url = withoutPreviewToken(win.location.href)
  if (url === win.location.href) return

  const state = win.history.state as Record<string, unknown> | null
  const cleanState =
    state && typeof state.current === 'string'
      ? { ...state, current: withoutPreviewToken(state.current) }
      : state
  win.history.replaceState(cleanState, '', url)
}

/** Whether a query string (`location.search`) asks for the preview. */
export function hasPreviewQuery(search: string): boolean {
  return new URLSearchParams(search).has(PREVIEW_QUERY_PARAM)
}

/** The cache key of a CMS fetch: its own key, with `:preview` for a draft. */
export function toCmsCacheKey(key: string, preview: boolean): string {
  return preview ? `${key}${PREVIEW_CACHE_KEY_SUFFIX}` : key
}

/** Whether a cache key holds a draft (cleared when the preview ends). */
export function isPreviewCacheKey(key: string): boolean {
  return key.startsWith('cms:') && key.endsWith(PREVIEW_CACHE_KEY_SUFFIX)
}

/** A stored preview session that is well formed and not yet expired, or null. */
export function parseStoredPreviewSession(
  raw: string | null,
  now: number = Date.now(),
): StoredPreviewSession | null {
  if (!raw) return null

  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }

  const session = storedPreviewSessionSchema.safeParse(value)
  if (!session.success || Date.parse(session.data.expiresAt) <= now) {
    return null
  }
  return session.data
}

// sessionStorage can throw (blocked storage, a sandboxed frame); the preview
// then only lasts until the page is reloaded.
export function readStoredPreviewSession(): StoredPreviewSession | null {
  try {
    return parseStoredPreviewSession(
      sessionStorage.getItem(PREVIEW_STORAGE_KEY),
    )
  } catch {
    return null
  }
}

export function storePreviewSession(session: StoredPreviewSession) {
  try {
    sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // See readStoredPreviewSession()
  }
}

export function forgetPreviewSession() {
  try {
    sessionStorage.removeItem(PREVIEW_STORAGE_KEY)
  } catch {
    // See readStoredPreviewSession()
  }
}

/** Milliseconds until the preview expires, 0 when it already has. */
export function msUntilPreviewExpiry(
  expiresAt: string,
  now: number = Date.now(),
): number {
  const remaining = Date.parse(expiresAt) - now
  return Number.isFinite(remaining) ? Math.max(0, remaining) : 0
}

// Thrown by a CMS fetcher in preview mode when the server refused the token
// (401), so the composable can end the preview instead of showing anything
// else. A new error on purpose: the fetch error carries the request options,
// the token header included.
export function createPreviewUnauthorizedError(): Error {
  return Object.assign(new Error('The preview token was refused'), {
    statusCode: 401,
    previewUnauthorized: true,
  })
}

export function isPreviewUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { previewUnauthorized?: unknown }).previewUnauthorized === true
  )
}

/** The origin of Payload's URL (`runtimeConfig.public.payloadUrl`), or null. */
export function toPayloadOrigin(payloadUrl: string | undefined): string | null {
  if (!payloadUrl) return null
  try {
    const url = new URL(payloadUrl)
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.origin
      : null
  } catch {
    return null
  }
}

/**
 * The window Payload's Live Preview runs in, as @payloadcms/live-preview finds
 * it: the opener of a popped-out preview, else the parent of the preview
 * frame. Null when the page is neither.
 */
export function getLivePreviewHost(win: Window): Window | null {
  const opener = win.opener as Window | null
  if (opener && opener !== win) return opener
  return win.parent && win.parent !== win ? win.parent : null
}

/**
 * Whether a message is Payload's "document saved" event: it must come from
 * the Payload origin and from the window the page announced itself to. Its
 * content is not used beyond its type.
 */
export function isPayloadDocumentEvent(
  event: Pick<MessageEvent, 'origin' | 'source' | 'data'>,
  payloadOrigin: string,
  host: Window,
): boolean {
  return (
    event.origin === payloadOrigin &&
    event.source === host &&
    typeof event.data === 'object' &&
    event.data !== null &&
    (event.data as { type?: unknown }).type === PAYLOAD_DOCUMENT_EVENT_MESSAGE
  )
}
