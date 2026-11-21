import { z } from 'zod'

import { cmsGlobalQuerySchema } from '~/types/cms'
import { SUPPORTED_LOCALES } from '~/utils/locale'

// Draft preview of Payload content (issue #53). The contract with Payload is
// described in the payload-backend-todo skill; the rules that keep a draft
// away from other visitors are in CLAUDE.md ("Draft preview").

// Marks a page request as a preview (`/pl?preview=1`). Only its presence
// counts: it switches on the preview response headers (no-store, noindex, the
// wider frame-ancestors) and keeps the page out of the CDN cache. It never
// makes the server render a draft.
export const PREVIEW_QUERY_PARAM = 'preview'

// Request header the browser sends the preview token in, to
// /api/preview/session and /api/preview/cms/<slug>. Never a query parameter:
// that would end up in access logs and in CDN cache keys.
export const PREVIEW_TOKEN_HEADER = 'x-preview-token'

// Fragment parameter the entry redirect hands the token over in
// (`/pl?preview=1#token=<JWT>`). A fragment is never sent to a server.
export const PREVIEW_TOKEN_FRAGMENT_PARAM = 'token'

// A compact JWS (header.payload.signature, base64url). The length limit keeps
// an oversized header or query from reaching the signature check.
export const previewTokenSchema = z
  .string()
  .max(4096)
  .regex(/^[\w-]+\.[\w-]+\.[\w-]+$/, 'Expected a signed token')

// Claims Payload puts in the token besides iss/aud/iat/exp (checked by
// verifyPreviewToken() in server/utils/preview.ts): the Payload user (`sub`)
// and the global and content locale the editor opened the preview from.
export const previewTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  iat: z.number().int(),
  exp: z.number().int(),
  global: z.string().optional(),
  locale: z.string().optional(),
})

export type PreviewTokenClaims = z.infer<typeof previewTokenClaimsSchema>

// A storefront path the entry redirect may go to, relative to the country
// (`/`, `/store`). Letters, digits, `-`, `_` and `/` only, no `//`, so the
// redirect can't leave the storefront or carry a query of its own.
export const previewPathSchema = z
  .string()
  .max(512)
  .regex(/^\/(?:[\w-]+(?:\/[\w-]+)*\/?)?$/, 'Expected a storefront path')

// Query of GET /api/preview, the link Payload's Preview button and Live
// Preview pane open: `?token=<JWT>&locale=<en|pl>&path=/&global=<slug>`. The
// global is only compared with the token's claim; it doesn't have to be one
// the storefront reads (Payload has more globals than CMS_GLOBAL_SLUGS).
export const previewEntryQuerySchema = z.object({
  token: previewTokenSchema,
  locale: z.enum(SUPPORTED_LOCALES),
  path: previewPathSchema.default('/'),
  global: z
    .string()
    .regex(/^[a-z0-9-]{1,64}$/, 'Expected a global slug')
    .optional(),
})

export type PreviewEntryQuery = z.infer<typeof previewEntryQuerySchema>

// Query of GET /api/preview/cms/<slug>: the same whitelist as the public
// proxy (locale, depth). There is no `draft` parameter on either; asking
// Payload for the draft is the preview endpoint's own decision.
export const previewDraftQuerySchema = cmsGlobalQuerySchema

// Answer of POST /api/preview/session for a valid token
export interface PreviewSession {
  expiresAt: string
}

// The browser side of the preview (app/plugins/preview.client.ts,
// app/composables/preview.ts). The token is kept in sessionStorage under this
// key: per tab, never sent to a server (unlike a cookie), gone with the tab,
// and it lets a reload of the preview tab keep the preview. It is removed on
// exit, on expiry and on a 401.
export const PREVIEW_STORAGE_KEY = 'payload-preview'

export const storedPreviewSessionSchema = z.object({
  token: previewTokenSchema,
  expiresAt: z.iso.datetime(),
})

export type StoredPreviewSession = z.infer<typeof storedPreviewSessionSchema>

// useState('preview'). Always `off` on the server and during hydration (the
// plugin sets it once the app is ready), so the server render and the
// hydration never depend on it. `expired`: the token was refused (401), ran
// out, or the page has `?preview` without one; nothing is fetched then, not
// even the published version, and the banner says so.
export const PREVIEW_STATUS = {
  off: 'off',
  active: 'active',
  expired: 'expired',
} as const

export type PreviewStatus = (typeof PREVIEW_STATUS)[keyof typeof PREVIEW_STATUS]

// A union, not a flat object with an optional token: `token` and `expiresAt`
// exist only while the preview is active, and checking `status` narrows to them.
export type PreviewState =
  | { status: typeof PREVIEW_STATUS.off }
  | { status: typeof PREVIEW_STATUS.active; token: string; expiresAt: string }
  | { status: typeof PREVIEW_STATUS.expired }

// What a CMS fetcher gets in preview mode: the token of the active preview,
// or null once it has expired (the fetcher then returns no content instead
// of the published version).
export interface CmsPreviewRequest {
  token: string | null
}

// Appended to a CMS cache key in preview mode (`cms:navigation:pl:preview`),
// so a draft never lands under the key of the published version.
export const PREVIEW_CACHE_KEY_SUFFIX = ':preview'

// Payload's Live Preview messages (@payloadcms/live-preview): the page
// announces itself with `{ type: 'payload-live-preview', ready: true }` and
// Payload posts `{ type: 'payload-document-event', ... }` after a save.
export const PAYLOAD_LIVE_PREVIEW_MESSAGE = 'payload-live-preview'
export const PAYLOAD_DOCUMENT_EVENT_MESSAGE = 'payload-document-event'

// The parts of the runtime config the preview reads. `payloadPreview` is
// private (server only, never `public`); its values come from the
// NUXT_PAYLOAD_PREVIEW_* variables at runtime.
export interface PreviewRuntimeConfigInput {
  payloadPreview?: {
    secret?: string
    apiKey?: string
    apiKeyCollection?: string
    frameAncestors?: string
  }
  public: { payloadUrl?: string }
}

// What resolvePreviewConfig() makes of it. `enabled` is false while the
// secret or the API key is missing (or unusable); every /api/preview route
// then answers 404 and no response gets the wider frame-ancestors.
export interface PreviewConfig {
  enabled: boolean
  secret: string
  apiKey: string
  apiKeyCollection: string
  payloadUrl: string
  // Origins besides 'self' that may frame a preview response: the Payload
  // origin and the Medusa admin origins
  frameAncestors: string[]
}

// Credentials payloadDraftRepository() sends to Payload
export interface PayloadDraftCredentials {
  apiKey: string
  apiKeyCollection: string
}
