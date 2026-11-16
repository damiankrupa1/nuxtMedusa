import type { H3Event } from 'h3'
import { jwtVerify } from 'jose'

import type { PreviewConfig, PreviewTokenClaims } from '~/types/preview'
import {
  PREVIEW_TOKEN_HEADER,
  previewTokenClaimsSchema,
  previewTokenSchema,
} from '~/types/preview'
import { PREVIEW_SECRET_MIN_LENGTH } from '~~/server/utils/preview'

// The preview token is minted by Payload (simple-landing-page-nuxt,
// payload-cms/src/preview/previewUrl.ts) with the secret both sides share:
// HS256, `iss: payload-cms`, `aud: storefront-preview`, claims `sub`,
// `global`, `locale`, and `iat`/`exp` quantised to the hour (valid for one to
// two hours). It proves that a signed-in editor opened the preview; the
// storefront reads the drafts with its own API key.
export const PREVIEW_TOKEN_ISSUER = 'payload-cms'
export const PREVIEW_TOKEN_AUDIENCE = 'storefront-preview'
// Payload issues tokens for exactly two hours; anything longer was not made
// by it and is refused, whatever its signature.
export const PREVIEW_TOKEN_MAX_LIFETIME_SECONDS = 2 * 60 * 60
export const PREVIEW_CLOCK_TOLERANCE_SECONDS = 60

/**
 * The token's claims when it is a valid preview token for this storefront,
 * else `null`: a wrong signature, algorithm (only HS256; `none` and RS256 are
 * refused), issuer or audience, an expired token, an `iat` in the future, a
 * lifetime above two hours or a secret too short to be trusted. Never throws.
 */
export async function verifyPreviewToken(
  token: unknown,
  secret: string,
  now: Date = new Date(),
): Promise<PreviewTokenClaims | null> {
  if (secret.length < PREVIEW_SECRET_MIN_LENGTH) return null

  const compact = previewTokenSchema.safeParse(token)
  if (!compact.success) return null

  try {
    const { payload } = await jwtVerify(
      compact.data,
      new TextEncoder().encode(secret),
      {
        algorithms: ['HS256'],
        issuer: PREVIEW_TOKEN_ISSUER,
        audience: PREVIEW_TOKEN_AUDIENCE,
        clockTolerance: PREVIEW_CLOCK_TOLERANCE_SECONDS,
        // Also requires `iat` and refuses one in the future
        maxTokenAge: PREVIEW_TOKEN_MAX_LIFETIME_SECONDS,
        requiredClaims: ['exp', 'sub'],
        currentDate: now,
      },
    )

    const claims = previewTokenClaimsSchema.safeParse(payload)
    if (!claims.success) return null

    const nowSeconds = Math.floor(now.getTime() / 1000)
    const { iat, exp } = claims.data
    if (
      exp - iat > PREVIEW_TOKEN_MAX_LIFETIME_SECONDS ||
      exp - nowSeconds >
        PREVIEW_TOKEN_MAX_LIFETIME_SECONDS + PREVIEW_CLOCK_TOLERANCE_SECONDS
    ) {
      return null
    }

    return claims.data
  } catch {
    // jose's verification errors: nothing about them goes to the caller, the
    // logs or Sentry (they would carry the token's claims)
    return null
  }
}

/**
 * The claims of the token in the request's x-preview-token header, or a 401.
 * The header is the only place a preview route reads a token from.
 */
export async function requirePreviewToken(
  event: H3Event,
  config: PreviewConfig,
): Promise<PreviewTokenClaims> {
  const claims = await verifyPreviewToken(
    getHeader(event, PREVIEW_TOKEN_HEADER),
    config.secret,
  )
  if (!claims) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired preview token',
    })
  }
  return claims
}
