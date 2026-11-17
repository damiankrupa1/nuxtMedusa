// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { generateKeyPair, SignJWT } from 'jose'

import { verifyPreviewToken } from '~~/server/utils/preview-token'
import {
  mintPreviewToken,
  TEST_PREVIEW_SECRET,
} from '~~/tests/unit/server/preview-harness'

const HOUR = 60 * 60
const now = new Date('2026-11-14T12:30:00Z')
const nowSeconds = Math.floor(now.getTime() / 1000)
// Payload quantises iat to the hour: 12:00, valid until 14:00
const issuedAt = Math.floor(nowSeconds / HOUR) * HOUR

const base64url = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString('base64url')

const verify = (token: unknown, secret = TEST_PREVIEW_SECRET) =>
  verifyPreviewToken(token, secret, now)

describe('verifyPreviewToken', () => {
  it('accepts a token minted the way Payload mints it and returns its claims', async () => {
    const token = await mintPreviewToken({ issuedAt })

    await expect(verify(token)).resolves.toEqual({
      sub: '1',
      iat: issuedAt,
      exp: issuedAt + 2 * HOUR,
      global: 'navigation',
      locale: 'pl',
    })
  })

  it('accepts a token issued up to two hours ago that has not expired yet', async () => {
    const token = await mintPreviewToken({
      issuedAt: nowSeconds - 2 * HOUR + 30,
    })

    await expect(verify(token)).resolves.not.toBeNull()
  })

  it('refuses an expired token, beyond the minute of clock tolerance', async () => {
    const expiredJustNow = await mintPreviewToken({
      issuedAt: nowSeconds - 2 * HOUR - 30,
    })
    const expiredLongAgo = await mintPreviewToken({
      issuedAt: nowSeconds - 3 * HOUR,
    })

    // 30 s past exp is within the tolerance, 1 h is not
    await expect(verify(expiredJustNow)).resolves.not.toBeNull()
    await expect(verify(expiredLongAgo)).resolves.toBeNull()
  })

  it('refuses a token with a wrong signature or signed with another secret', async () => {
    const token = await mintPreviewToken({ issuedAt })
    const [header, payload, signature] = token.split('.')
    const tampered = `${header}.${base64url({
      global: 'navigation',
      locale: 'pl',
      sub: '2',
      iat: issuedAt,
      exp: issuedAt + 2 * HOUR,
      iss: 'payload-cms',
      aud: 'storefront-preview',
    })}.${signature}`

    await expect(verify(tampered)).resolves.toBeNull()
    await expect(verify(`${header}.${payload}.AAAA`)).resolves.toBeNull()
    await expect(
      verify(
        await mintPreviewToken({
          issuedAt,
          secret: 'another-secret-of-sufficient-length-0123',
        }),
      ),
    ).resolves.toBeNull()
  })

  it('refuses a wrong audience or issuer', async () => {
    await expect(
      verify(await mintPreviewToken({ issuedAt, audience: 'payload' })),
    ).resolves.toBeNull()
    await expect(
      verify(await mintPreviewToken({ issuedAt, issuer: 'medusa-admin' })),
    ).resolves.toBeNull()
  })

  it('refuses alg none', async () => {
    const claims = {
      global: 'navigation',
      locale: 'pl',
      sub: '1',
      iat: issuedAt,
      exp: issuedAt + 2 * HOUR,
      iss: 'payload-cms',
      aud: 'storefront-preview',
    }
    const unsigned = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url(claims)}.`
    const unsignedWithJunk = `${unsigned}x`

    await expect(verify(unsigned)).resolves.toBeNull()
    await expect(verify(unsignedWithJunk)).resolves.toBeNull()
  })

  it('refuses RS256 and HS512 tokens, whatever they are signed with', async () => {
    const { privateKey } = await generateKeyPair('RS256')
    const rs256 = await new SignJWT({ global: 'navigation', locale: 'pl' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer('payload-cms')
      .setAudience('storefront-preview')
      .setSubject('1')
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + 2 * HOUR)
      .sign(privateKey)
    const hs512 = await new SignJWT({ global: 'navigation', locale: 'pl' })
      .setProtectedHeader({ alg: 'HS512' })
      .setIssuer('payload-cms')
      .setAudience('storefront-preview')
      .setSubject('1')
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + 2 * HOUR)
      .sign(new TextEncoder().encode(TEST_PREVIEW_SECRET))

    await expect(verify(rs256)).resolves.toBeNull()
    await expect(verify(hs512)).resolves.toBeNull()
  })

  it('refuses a lifetime above two hours, even when correctly signed', async () => {
    await expect(
      verify(await mintPreviewToken({ issuedAt, lifetime: 2 * HOUR + 1 })),
    ).resolves.toBeNull()
    await expect(
      verify(await mintPreviewToken({ issuedAt, lifetime: 30 * 24 * HOUR })),
    ).resolves.toBeNull()
  })

  it('refuses a token issued in the future', async () => {
    await expect(
      verify(await mintPreviewToken({ issuedAt: nowSeconds + 10 * 60 })),
    ).resolves.toBeNull()
  })

  it('refuses a token without a subject', async () => {
    const token = await new SignJWT({ global: 'navigation', locale: 'pl' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('payload-cms')
      .setAudience('storefront-preview')
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + 2 * HOUR)
      .sign(new TextEncoder().encode(TEST_PREVIEW_SECRET))

    await expect(verify(token)).resolves.toBeNull()
  })

  it.each([
    undefined,
    null,
    '',
    'garbage',
    'a.b',
    'a.b.c',
    `${'a'.repeat(5000)}.b.c`,
    ['a.b.c'],
    42,
  ])('refuses a malformed token (%#) without throwing', async (token) => {
    await expect(verify(token)).resolves.toBeNull()
  })

  it('is off with an empty or too short secret, even for a token signed with it', async () => {
    const short = 'short-secret'
    const token = await mintPreviewToken({ issuedAt, secret: short })

    await expect(verify(token, short)).resolves.toBeNull()
    await expect(
      verify(await mintPreviewToken({ issuedAt }), ''),
    ).resolves.toBeNull()
  })
})
