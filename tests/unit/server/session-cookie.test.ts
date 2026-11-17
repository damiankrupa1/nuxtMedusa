import { describe, expect, it } from 'vitest'

import {
  SESSION_FALLBACK_MAX_AGE,
  sessionMaxAge,
} from '~~/server/utils/session-cookie'

// The cookie's attributes are pinned through real requests in
// customers-routes.test.ts; this covers how its lifetime is read from the
// token.

const now = Date.UTC(2026, 10, 16, 12, 0, 0)
const nowInSeconds = now / 1000

const base64url = (value: string) =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const jwtWithPayload = (payload: string) =>
  [base64url('{"alg":"HS256","typ":"JWT"}'), base64url(payload), 'sig'].join(
    '.',
  )
const jwt = (claims: Record<string, unknown>) =>
  jwtWithPayload(JSON.stringify(claims))

describe('sessionMaxAge', () => {
  it('is Medusa’s default 24 hours', () => {
    expect(SESSION_FALLBACK_MAX_AGE).toBe(86400)
  })

  it('lasts until the token’s exp', () => {
    expect(sessionMaxAge(jwt({ exp: nowInSeconds + 86400 }), now)).toBe(86400)
    expect(sessionMaxAge(jwt({ exp: nowInSeconds + 7 * 86400 }), now)).toBe(
      7 * 86400,
    )
  })

  it('rounds a fractional remainder down', () => {
    expect(sessionMaxAge(jwt({ exp: nowInSeconds + 60 }), now + 500)).toBe(59)
  })

  it('decodes a base64url payload (with - and _)', () => {
    // '?>' and '~~' encode to base64 with '/' and '+', i.e. '_' and '-' here
    const token = jwtWithPayload(
      JSON.stringify({ exp: nowInSeconds + 120, note: '?>?>~~~' }),
    )
    expect(token.split('.')[1]).toMatch(/[-_]/)

    expect(sessionMaxAge(token, now)).toBe(120)
  })

  it.each([
    ['a token that is no JWT', 'login-token'],
    ['an empty token', ''],
    ['a payload that is no base64', 'a.%%%.c'],
    ['a payload that is no JSON', jwtWithPayload('not json')],
    ['a payload without exp', jwt({ actor_id: 'cus_1' })],
    ['an exp that is no number', jwt({ exp: '1700000000' })],
    ['an exp in the past', jwt({ exp: nowInSeconds - 1 })],
    ['an exp of now', jwt({ exp: nowInSeconds })],
  ])('falls back to 24 hours for %s', (_case, token) => {
    expect(sessionMaxAge(token, now)).toBe(SESSION_FALLBACK_MAX_AGE)
  })
})
