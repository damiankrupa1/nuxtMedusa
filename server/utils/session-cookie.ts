import type { H3Event } from 'h3'

// The customer's session: the JWT Medusa issued at login/register, kept in an
// HttpOnly cookie on the storefront's origin and sent to Medusa as a bearer
// token by server/api/customers/** only. Nothing in the browser reads it: the
// browser's Medusa client (useMedusaClient) never authenticates as the
// customer, and every customer call goes through those routes.
export const SESSION_COOKIE = 'medusa_jwt'

// Medusa's default `http.jwtExpiresIn` (24h), for a token whose `exp` can't
// be read. The backend doesn't override it today.
export const SESSION_FALLBACK_MAX_AGE = 24 * 60 * 60

// The attributes the cookie is set and cleared with; a cookie is only
// replaced or deleted by one with the same name, path and domain.
// - httpOnly: an XSS can't read the token.
// - secure: when the request reached us over https. h3 takes that from
//   `x-forwarded-proto`, which Vercel's edge sets. Local `pnpm dev`/`preview`
//   and the e2e build run on plain http, where a Secure cookie would depend
//   on the browser treating that host as secure (not every browser does for
//   localhost, none for another http host). A spoofed header only changes
//   the sender's own cookie.
// - sameSite lax: not sent on cross-site subrequests (CSRF), still sent on a
//   top-level navigation back to the store (Przelewy24's return).
const sessionCookieAttributes = (event: H3Event) => ({
  httpOnly: true,
  secure: getRequestProtocol(event) === 'https',
  sameSite: 'lax' as const,
  path: '/',
})

// Seconds until the token's `exp`, so the cookie and the token end together.
// The payload is only decoded, not verified: Medusa verifies the token on
// every call, this only sets the cookie's lifetime. A token without a usable
// future `exp` gets Medusa's default lifetime.
export function sessionMaxAge(token: string, now = Date.now()): number {
  try {
    const payload = token.split('.')[1]
    if (!payload) return SESSION_FALLBACK_MAX_AGE

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(base64)) as { exp?: unknown }
    if (typeof exp !== 'number' || !Number.isFinite(exp)) {
      return SESSION_FALLBACK_MAX_AGE
    }

    const remaining = Math.floor(exp - now / 1000)
    return remaining > 0 ? remaining : SESSION_FALLBACK_MAX_AGE
  } catch {
    return SESSION_FALLBACK_MAX_AGE
  }
}

// The session token, or undefined without one (an empty cookie included)
export const getSessionToken = (event: H3Event): string | undefined =>
  getCookie(event, SESSION_COOKIE) || undefined

export const setSessionCookie = (event: H3Event, token: string) =>
  setCookie(event, SESSION_COOKIE, token, {
    ...sessionCookieAttributes(event),
    maxAge: sessionMaxAge(token),
  })

export const clearSessionCookie = (event: H3Event) =>
  deleteCookie(event, SESSION_COOKIE, sessionCookieAttributes(event))
