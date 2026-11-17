// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventHandler } from 'h3'

import {
  createTestApp,
  installNitroGlobals,
  mintPreviewToken,
  nitro,
  previewRuntimeConfig,
} from '~~/tests/unit/server/preview-harness'

const regions = vi.fn()
let entryHandler: EventHandler

const region = (...countries: [string, string][]) => ({
  countries: countries.map(([iso_2, name]) => ({ iso_2, name })),
})

beforeAll(async () => {
  installNitroGlobals({
    defineCachedEventHandler: () => {
      throw new Error('A preview route must not use defineCachedEventHandler')
    },
  })
  entryHandler = (await import('~~/server/api/preview/index.get')).default
})

beforeEach(() => {
  vi.clearAllMocks()
  nitro.runtimeConfig = previewRuntimeConfig()
  regions.mockResolvedValue({
    regions: [
      region(['pl', 'Poland']),
      region(['fr', 'France'], ['de', 'Germany']),
    ],
  })
})

const request = createTestApp(
  { get: { '/api/preview': (event) => entryHandler(event) } },
  { regions: (...args: unknown[]) => regions(...args) },
)

const enter = (query: Record<string, string>) =>
  request(`/api/preview?${new URLSearchParams(query)}`, { redirect: 'manual' })

describe('GET /api/preview (entry link from Payload)', () => {
  it('redirects a Polish preview to /pl with the marker and the token in the fragment', async () => {
    const token = await mintPreviewToken({ locale: 'pl', global: 'navigation' })

    const response = await enter({
      token,
      locale: 'pl',
      path: '/',
      global: 'navigation',
    })

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe(
      `/pl?preview=1#token=${token}`,
    )
    expect(regions).toHaveBeenCalledWith('/api/regions')
  })

  it('redirects an English preview to the first non-Polish region country', async () => {
    const token = await mintPreviewToken({ locale: 'en', global: 'brands' })

    const response = await enter({
      token,
      locale: 'en',
      path: '/',
      global: 'brands',
    })

    // Countries are sorted by name: France before Germany
    expect(response.headers.get('location')).toBe(
      `/fr?preview=1#token=${token}`,
    )
  })

  it('keeps the requested storefront path', async () => {
    const token = await mintPreviewToken()

    const response = await enter({ token, locale: 'pl', path: '/store' })

    expect(response.headers.get('location')).toBe(
      `/pl/store?preview=1#token=${token}`,
    )
  })

  it('falls back to the default country when the regions cannot be loaded', async () => {
    regions.mockRejectedValue(new Error('Medusa down'))
    const token = await mintPreviewToken({ locale: 'en' })

    const response = await enter({ token, locale: 'en', path: '/' })

    expect(response.headers.get('location')).toBe(
      `/pl?preview=1#token=${token}`,
    )
  })

  it('answers private, no-store and noindex, with the preview frame-ancestors', async () => {
    const response = await enter({
      token: await mintPreviewToken(),
      locale: 'pl',
    })

    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(response.headers.get('referrer-policy')).toBe('no-referrer')
    expect(response.headers.get('content-security-policy')).toBe(
      "frame-ancestors 'self' https://cms.example.com https://admin.example.com",
    )
  })

  it.each([
    ['no token', { locale: 'pl' }],
    ['an unknown locale', { token: 'a.b.c', locale: 'de' }],
    [
      'a path to another host',
      { token: 'a.b.c', locale: 'pl', path: '//evil.example.com' },
    ],
    [
      'an absolute URL',
      { token: 'a.b.c', locale: 'pl', path: 'https://evil.example.com' },
    ],
    ['an invalid global', { token: 'a.b.c', locale: 'pl', global: '../users' }],
  ])('answers 400 for %s', async (_name, query) => {
    const response = await enter(query as Record<string, string>)

    expect(response.status).toBe(400)
    expect(response.headers.get('location')).toBeNull()
  })

  it('answers 401 for an invalid token, with a readable reason and no redirect', async () => {
    const response = await enter({
      token: await mintPreviewToken({
        secret: 'not-the-shared-secret-0123456789abcdef',
      }),
      locale: 'pl',
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('content-type')).toContain('text/plain')
    await expect(response.text()).resolves.toContain('invalid or has expired')
  })

  it('answers 401 for a token issued for another locale or global', async () => {
    const token = await mintPreviewToken({ locale: 'en', global: 'brands' })

    const otherLocale = await enter({ token, locale: 'pl', global: 'brands' })
    const otherGlobal = await enter({
      token,
      locale: 'en',
      global: 'navigation',
    })

    expect(otherLocale.status).toBe(401)
    expect(otherGlobal.status).toBe(401)
  })

  it('answers 404 while the preview is not configured', async () => {
    nitro.runtimeConfig = previewRuntimeConfig({ apiKey: '' })

    const response = await enter({
      token: await mintPreviewToken(),
      locale: 'pl',
    })

    expect(response.status).toBe(404)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })
})
