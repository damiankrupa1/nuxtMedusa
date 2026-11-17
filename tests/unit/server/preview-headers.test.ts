// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createError, defineEventHandler, setResponseHeader } from 'h3'

import {
  createTestApp,
  installNitroGlobals,
  loadPlugin,
  nitro,
  previewRuntimeConfig,
  runHooks,
} from '~~/tests/unit/server/preview-harness'

const CDN = 'max-age=60, stale-while-revalidate=300'
const PREVIEW_POLICY =
  "frame-ancestors 'self' https://cms.example.com https://admin.example.com"
const DEFAULT_POLICY = "frame-ancestors 'self'"

type Hook = (...args: never[]) => unknown
type RenderResponse = { statusCode?: number; headers?: Record<string, string> }

let frameAncestorsHooks: Record<string, Hook[]>
let cdnCacheHooks: Record<string, Hook[]>
let previewHooks: Record<string, Hook[]>

beforeAll(async () => {
  installNitroGlobals()
  // Nitro loads plugins in file order: cdn-cache, frame-ancestors, preview
  cdnCacheHooks = await loadPlugin(() => import('~~/server/plugins/cdn-cache'))
  frameAncestorsHooks = await loadPlugin(
    () => import('~~/server/plugins/frame-ancestors'),
  )
  previewHooks = await loadPlugin(() => import('~~/server/plugins/preview'))
})

beforeEach(() => {
  nitro.runtimeConfig = previewRuntimeConfig()
})

// An API/route response through the request and beforeResponse hooks of the
// three plugins, with a handler that tries to make itself shareable
const request = (path: string) =>
  createTestApp(routes, {
    pluginHooks: [cdnCacheHooks, frameAncestorsHooks, previewHooks],
  })(path)

const routes = {
  get: {
    '/api/preview/cms/:slug': defineEventHandler((event) => {
      setResponseHeader(event, 'cdn-cache-control', CDN)
      setResponseHeader(event, 'surrogate-control', 'max-age=60')
      return { ok: true }
    }),
    '/api/preview/broken': defineEventHandler(() => {
      throw createError({ statusCode: 500, message: 'boom' })
    }),
    '/api/cms/:slug': defineEventHandler((event) => {
      setResponseHeader(event, 'cache-control', 's-maxage=60')
      return { ok: true }
    }),
  },
}

// A page render (server/plugins/cdn-cache.ts and preview.ts both act on
// render:response); `cdnCache` is what app/plugins/cdn-cache.server.ts sets
const render = (path: string, { cdnCache = true, statusCode = 200 } = {}) => {
  // What the request hook of frame-ancestors.ts left on the response
  const resHeaders = new Map([['content-security-policy', DEFAULT_POLICY]])
  const event = {
    path,
    context: { cdnCache },
    node: {
      req: { headers: {} },
      res: {
        statusCode,
        hasHeader: (name: string) => resHeaders.has(name.toLowerCase()),
        getHeader: (name: string) => resHeaders.get(name.toLowerCase()),
        setHeader: (name: string, value: string) =>
          resHeaders.set(name.toLowerCase(), value),
        removeHeader: (name: string) => resHeaders.delete(name.toLowerCase()),
      },
    },
  }
  const response: RenderResponse = {
    statusCode,
    headers: { 'content-type': 'text/html;charset=utf-8' },
  }
  runHooks(
    [cdnCacheHooks, frameAncestorsHooks, previewHooks],
    'render:response',
    response,
    { event },
  )
  return { ...Object.fromEntries(resHeaders), ...response.headers }
}

describe('preview response headers', () => {
  it('makes a ?preview page on a cdnCache route private, no-store and noindex, without CDN headers', () => {
    const headers = render('/pl?preview=1')

    expect(headers['cache-control']).toBe('private, no-store')
    expect(headers['x-robots-tag']).toBe('noindex, nofollow')
    expect(headers['cdn-cache-control']).toBeUndefined()
    expect(headers['vercel-cdn-cache-control']).toBeUndefined()
    expect(headers['surrogate-control']).toBeUndefined()
  })

  it('replaces the default frame-ancestors with the preview list on a ?preview page', () => {
    expect(render('/pl?preview=1')['content-security-policy']).toBe(
      PREVIEW_POLICY,
    )
  })

  it('removes CDN headers that something else put on the rendered response', () => {
    const response: RenderResponse = {
      statusCode: 200,
      headers: {
        'CDN-Cache-Control': CDN,
        'Vercel-CDN-Cache-Control': CDN,
        'Surrogate-Control': 'max-age=60',
        'Cache-Control': 'public, max-age=60',
      },
    }
    const event = {
      path: '/pl/store?preview=1',
      context: {},
      node: {
        res: {
          statusCode: 200,
          hasHeader: () => false,
          getHeader: () => undefined,
          setHeader: () => undefined,
          removeHeader: () => undefined,
        },
      },
    }
    runHooks([previewHooks], 'render:response', response, { event })

    expect(response.headers).toEqual({
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'no-referrer',
      'content-security-policy': PREVIEW_POLICY,
    })
  })

  it('leaves an ordinary cdnCache page shareable and framed by itself only', () => {
    const headers = render('/pl')

    expect(headers['cdn-cache-control']).toBe(CDN)
    expect(headers['cache-control']).toBeUndefined()
    expect(headers['x-robots-tag']).toBeUndefined()
    expect(headers['content-security-policy']).toBe(DEFAULT_POLICY)
  })

  it('makes a /api/preview answer private and strips the CDN headers its handler set', async () => {
    const response = await request('/api/preview/cms/navigation?locale=pl')

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(response.headers.get('cdn-cache-control')).toBeNull()
    expect(response.headers.get('surrogate-control')).toBeNull()
    expect(response.headers.get('content-security-policy')).toBe(PREVIEW_POLICY)
  })

  it.each(['/api/preview/broken', '/api/preview/unknown'])(
    'covers errors and unknown paths under /api/preview too (%s)',
    async (path) => {
      const response = await request(path)

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.headers.get('cache-control')).toBe('private, no-store')
      expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    },
  )

  it('leaves the public CMS proxy and its cache header alone', async () => {
    const response = await request('/api/cms/navigation?locale=pl&draft=true')

    expect(response.headers.get('cache-control')).toBe('s-maxage=60')
    expect(response.headers.get('x-robots-tag')).toBeNull()
    expect(response.headers.get('content-security-policy')).toBe(DEFAULT_POLICY)
  })

  it('keeps the default frame-ancestors while the preview is not configured, but still no-store', async () => {
    nitro.runtimeConfig = previewRuntimeConfig({ secret: '' })

    const page = render('/pl?preview=1')
    const api = await request('/api/preview/cms/navigation')

    expect(page['content-security-policy']).toBe(DEFAULT_POLICY)
    expect(page['cache-control']).toBe('private, no-store')
    expect(page['cdn-cache-control']).toBeUndefined()
    expect(api.headers.get('content-security-policy')).toBe(DEFAULT_POLICY)
    expect(api.headers.get('cache-control')).toBe('private, no-store')
  })
})
