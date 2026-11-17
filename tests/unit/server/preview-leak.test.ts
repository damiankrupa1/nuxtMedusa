// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { EventHandler, H3Event } from 'h3'
import { defineEventHandler } from 'h3'

import {
  createTestApp,
  installNitroGlobals,
  mintPreviewToken,
  nitro,
  previewRuntimeConfig,
  TEST_API_KEY,
} from '~~/tests/unit/server/preview-harness'

// The main risk of #53: a draft served to someone who is not previewing. This
// plays both routes against a fake Payload that behaves like the real one
// (simple-landing-page-nuxt#20): the draft only for `draft=true` with the
// service account's API key, the published version for everybody else, also
// for an anonymous `draft=true`. The public proxy runs inside a cache stub that
// remembers every answer by path and query, like Nitro's cache and a CDN
// would, and hands the request headers through (Nitro wouldn't even do that).
const PUBLISHED = { primaryNav: [{ label: 'Published', url: '/store' }] }
const DRAFT = { primaryNav: [{ label: 'DRAFT', url: '/store' }] }

const fakePayload = async (
  _url: string,
  options: {
    query?: Record<string, unknown>
    headers?: Record<string, string>
  },
) => {
  const authorized =
    options.headers?.authorization === `service-users API-Key ${TEST_API_KEY}`
  return structuredClone(
    authorized && options.query?.draft === 'true' ? DRAFT : PUBLISHED,
  )
}

const cache = new Map<string, unknown>()
const cachedEventHandler = (handler: EventHandler) =>
  defineEventHandler(async (event: H3Event) => {
    const key = event.path
    if (cache.has(key)) return structuredClone(cache.get(key))
    const body = await handler(event)
    cache.set(key, structuredClone(body))
    return body
  })

let request: ReturnType<typeof createTestApp>

beforeAll(async () => {
  installNitroGlobals({
    $fetch: fakePayload,
    defineCachedEventHandler: cachedEventHandler,
  })
  const publicHandler = (await import('~~/server/api/cms/[slug].get')).default
  const previewHandler = (await import('~~/server/api/preview/cms/[slug].get'))
    .default
  request = createTestApp({
    get: {
      '/api/cms/:slug': publicHandler,
      '/api/preview/cms/:slug': previewHandler,
    },
  })
})

beforeEach(() => {
  cache.clear()
  nitro.runtimeConfig = previewRuntimeConfig()
})

const anonymous = async (path: string, headers?: Record<string, string>) =>
  (await request(path, { headers })).json()

const preview = async (path: string) =>
  (
    await request(path, {
      headers: { 'x-preview-token': await mintPreviewToken() },
    })
  ).json()

const cachedBodies = () => JSON.stringify([...cache.values()])

describe('a draft never reaches anyone who is not previewing', () => {
  it('preview first, then anonymous: the anonymous visitor gets the published version', async () => {
    await expect(
      preview('/api/preview/cms/navigation?locale=pl&depth=0'),
    ).resolves.toEqual(DRAFT)

    await expect(
      anonymous('/api/cms/navigation?locale=pl&depth=0'),
    ).resolves.toEqual(PUBLISHED)
    expect(cachedBodies()).not.toContain('DRAFT')
  })

  it('anonymous first, then preview: the editor gets the draft, the cache keeps the published one', async () => {
    await expect(
      anonymous('/api/cms/navigation?locale=pl&depth=0'),
    ).resolves.toEqual(PUBLISHED)

    await expect(
      preview('/api/preview/cms/navigation?locale=pl&depth=0'),
    ).resolves.toEqual(DRAFT)
    await expect(
      anonymous('/api/cms/navigation?locale=pl&depth=0'),
    ).resolves.toEqual(PUBLISHED)
    expect(cachedBodies()).not.toContain('DRAFT')
  })

  it('the public proxy ignores ?draft=true and the preview token header, before and after a preview', async () => {
    const token = await mintPreviewToken()
    const asks = [
      '/api/cms/navigation?locale=pl&depth=0&draft=true',
      '/api/cms/navigation?locale=pl&draft=true&token=' + token,
    ]

    const headers = {
      'x-preview-token': token,
      authorization: `service-users API-Key ${TEST_API_KEY}`,
    }

    await preview('/api/preview/cms/navigation?locale=pl&depth=0')
    await expect(
      Promise.all(asks.map((path) => anonymous(path, headers))),
    ).resolves.toEqual([PUBLISHED, PUBLISHED])
    await preview('/api/preview/cms/navigation?locale=pl&depth=0')
    await expect(
      Promise.all(asks.map((path) => anonymous(path, headers))),
    ).resolves.toEqual([PUBLISHED, PUBLISHED])

    expect(cache.size).toBe(asks.length)
    expect(cachedBodies()).not.toContain('DRAFT')
  })

  it('the preview route answers 401 to a visitor without a token, even after an editor previewed the same URL', async () => {
    await preview('/api/preview/cms/navigation?locale=pl&depth=0')

    const response = await request(
      '/api/preview/cms/navigation?locale=pl&depth=0',
    )

    expect(response.status).toBe(401)
    await expect(response.text()).resolves.not.toContain('DRAFT')
  })
})
