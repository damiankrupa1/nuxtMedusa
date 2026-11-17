// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventHandler } from 'h3'

import {
  createTestApp,
  installNitroGlobals,
  mintPreviewToken,
  nitro,
  previewRuntimeConfig,
  TEST_API_KEY,
} from '~~/tests/unit/server/preview-harness'

const fetchPayload = vi.fn()
const cachedHandlers = vi.fn()

let cmsHandler: EventHandler
let sessionHandler: EventHandler

beforeAll(async () => {
  installNitroGlobals({
    $fetch: fetchPayload,
    // The preview routes must never be cached: wrapping one of them in
    // defineCachedEventHandler makes this import throw and every test fail
    defineCachedEventHandler: (...args: unknown[]) => {
      cachedHandlers(...args)
      throw new Error('A preview route must not use defineCachedEventHandler')
    },
  })
  cmsHandler = (await import('~~/server/api/preview/cms/[slug].get')).default
  sessionHandler = (await import('~~/server/api/preview/session.post')).default
})

beforeEach(() => {
  vi.clearAllMocks()
  nitro.runtimeConfig = previewRuntimeConfig()
  fetchPayload.mockResolvedValue({ primaryNav: [], _status: 'draft' })
})

const request = createTestApp({
  get: { '/api/preview/cms/:slug': (event) => cmsHandler(event) },
  post: { '/api/preview/session': (event) => sessionHandler(event) },
})

const getDraft = async (path: string, token?: string) =>
  request(path, token ? { headers: { 'x-preview-token': token } } : undefined)

describe('GET /api/preview/cms/:slug', () => {
  it('is not a cached handler', () => {
    expect(cachedHandlers).not.toHaveBeenCalled()
  })

  it('answers 401 without a token and never calls Payload', async () => {
    const response = await getDraft('/api/preview/cms/navigation?locale=pl')

    expect(response.status).toBe(401)
    expect(fetchPayload).not.toHaveBeenCalled()
  })

  it('answers 401 for a bad or expired token and never calls Payload', async () => {
    const expired = await mintPreviewToken({
      issuedAt: Math.floor(Date.now() / 1000) - 3 * 60 * 60,
    })

    const responses = await Promise.all(
      ['garbage', expired].map((token) =>
        getDraft('/api/preview/cms/navigation?locale=pl', token),
      ),
    )

    expect(responses.map(({ status }) => status)).toEqual([401, 401])
    expect(fetchPayload).not.toHaveBeenCalled()
  })

  it('does not take the token from the query string', async () => {
    const token = await mintPreviewToken()

    const response = await getDraft(
      `/api/preview/cms/navigation?locale=pl&token=${token}`,
    )

    expect(response.status).toBe(401)
    expect(fetchPayload).not.toHaveBeenCalled()
  })

  it('asks Payload for the draft with the API key, a timeout and the parsed query', async () => {
    const response = await getDraft(
      '/api/preview/cms/navigation?locale=pl&depth=1&draft=false&extra=1',
      await mintPreviewToken(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      primaryNav: [],
      _status: 'draft',
    })
    expect(fetchPayload).toHaveBeenCalledTimes(1)
    expect(fetchPayload).toHaveBeenCalledWith(
      'https://cms.example.com/api/globals/navigation',
      {
        query: { locale: 'pl', depth: 1, draft: 'true' },
        headers: { authorization: `service-users API-Key ${TEST_API_KEY}` },
        signal: expect.any(AbortSignal),
      },
    )
  })

  it('answers private, no-store and noindex', async () => {
    const response = await getDraft(
      '/api/preview/cms/navigation?locale=pl',
      await mintPreviewToken(),
    )

    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(response.headers.get('cdn-cache-control')).toBeNull()
  })

  it('answers 404 for a global outside the allow-list, after the token check', async () => {
    const response = await getDraft(
      '/api/preview/cms/users?locale=pl',
      await mintPreviewToken(),
    )

    expect(response.status).toBe(404)
    expect(fetchPayload).not.toHaveBeenCalled()
  })

  it('answers 400 for an invalid query without calling Payload', async () => {
    const response = await getDraft(
      '/api/preview/cms/navigation?locale=xx-yyy&depth=9',
      await mintPreviewToken(),
    )

    expect(response.status).toBe(400)
    expect(fetchPayload).not.toHaveBeenCalled()
  })

  it('answers 503 while the Payload URL is missing', async () => {
    nitro.runtimeConfig = {
      ...previewRuntimeConfig(),
      public: { payloadUrl: '' },
    }

    const response = await getDraft(
      '/api/preview/cms/navigation?locale=pl',
      await mintPreviewToken(),
    )

    expect(response.status).toBe(503)
    expect(fetchPayload).not.toHaveBeenCalled()
  })

  it.each([
    ['no secret', { secret: '' }],
    ['no API key', { apiKey: '' }],
  ])(
    'answers 404, even with a valid token, while the preview has %s',
    async (_name, override) => {
      nitro.runtimeConfig = previewRuntimeConfig(override)

      const response = await getDraft(
        '/api/preview/cms/navigation?locale=pl',
        await mintPreviewToken(),
      )

      expect(response.status).toBe(404)
      expect(response.headers.get('cache-control')).toBe('private, no-store')
      expect(fetchPayload).not.toHaveBeenCalled()
    },
  )

  it('lets the repository 502 through and does not leak the API key in the answer', async () => {
    fetchPayload.mockRejectedValue(
      Object.assign(new Error('Unauthorized'), { statusCode: 401 }),
    )
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await getDraft(
      '/api/preview/cms/navigation?locale=pl',
      await mintPreviewToken(),
    )
    const body = await response.text()

    expect(response.status).toBe(502)
    expect(body).not.toContain(TEST_API_KEY)
    expect(body).not.toContain('API-Key')
  })
})

describe('POST /api/preview/session', () => {
  it('answers when a valid token expires', async () => {
    const issuedAt = Math.floor(Date.now() / 1000)
    const response = await request('/api/preview/session', {
      method: 'POST',
      headers: {
        'x-preview-token': await mintPreviewToken({ issuedAt }),
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      expiresAt: new Date((issuedAt + 2 * 60 * 60) * 1000).toISOString(),
    })
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })

  it('answers 401 without or with an invalid token', async () => {
    const missing = await request('/api/preview/session', { method: 'POST' })
    const invalid = await request('/api/preview/session', {
      method: 'POST',
      headers: {
        'x-preview-token': await mintPreviewToken({ audience: 'payload' }),
      },
    })

    expect(missing.status).toBe(401)
    expect(invalid.status).toBe(401)
  })

  it('answers 404 while the preview is not configured', async () => {
    nitro.runtimeConfig = previewRuntimeConfig({ secret: '' })

    const response = await request('/api/preview/session', {
      method: 'POST',
      headers: { 'x-preview-token': await mintPreviewToken() },
    })

    expect(response.status).toBe(404)
  })
})
