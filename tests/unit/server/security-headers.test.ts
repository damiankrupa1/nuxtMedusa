// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { H3Error, H3Event } from 'h3'
import {
  createError,
  defineEventHandler,
  send,
  sendRedirect,
  setResponseHeader,
  setResponseHeaders,
  setResponseStatus,
} from 'h3'
import nitroErrorHandler, {
  defaultHandler,
} from 'nitropack/runtime/internal/error/prod'

import type { PreviewRuntimeConfigInput } from '~/types/preview'
import type { SecurityHeadersRuntimeConfigInput } from '~/types/security'
import { buildContentSecurityPolicy } from '~~/server/utils/content-security-policy'
import {
  buildSecurityHeaders,
  isErrorPageRequest,
  PERMISSIONS_POLICY,
  serializePermissionsPolicy,
} from '~~/server/utils/security-headers'
import {
  createTestApp,
  installNitroGlobals,
  loadPlugin,
  nitro,
  previewRuntimeConfig,
  runHooks,
} from '~~/tests/unit/server/preview-harness'

const CDN = 'max-age=60, stale-while-revalidate=300'
const DEFAULT_FRAME_ANCESTORS = "frame-ancestors 'self'"
const PREVIEW_FRAME_ANCESTORS =
  "frame-ancestors 'self' https://cms.example.com https://admin.example.com"
const PERMISSIONS =
  'accelerometer=(), bluetooth=(), browsing-topics=(), camera=(), ' +
  'display-capture=(), geolocation=(self "https://geowidget-app.inpost.pl"), ' +
  'gyroscope=(), hid=(), magnetometer=(), microphone=(), midi=(), ' +
  'serial=(), usb=()'

// The preview tests' runtime config plus what the report-only policy reads
const cspRuntimeConfig = (
  csp: SecurityHeadersRuntimeConfigInput['csp'] = {},
) => {
  const preview = previewRuntimeConfig()
  const config: PreviewRuntimeConfigInput & SecurityHeadersRuntimeConfigInput =
    {
      ...preview,
      csp,
      public: {
        ...preview.public,
        medusa: { backendUrl: 'https://api.example.com' },
        sentry: { dsn: 'https://key@o1.ingest.sentry.io/2' },
      },
    }
  return config
}

type Hook = (...args: never[]) => unknown
type Hooks = Record<string, Hook[]>
type RenderResponse = {
  statusCode?: number
  headers?: Record<string, string>
  body?: string
}

describe('security header values', () => {
  it('sends nosniff, strict-origin-when-cross-origin and the permissions policy', () => {
    expect(buildSecurityHeaders()).toEqual({
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': PERMISSIONS,
    })
  })

  it('switches off camera, microphone and the rest, but keeps geolocation for the InPost map frame', () => {
    expect(PERMISSIONS_POLICY.camera).toEqual([])
    expect(PERMISSIONS_POLICY.microphone).toEqual([])
    expect(PERMISSIONS_POLICY.geolocation).toEqual([
      'self',
      'https://geowidget-app.inpost.pl',
    ])
  })

  it("leaves the features Stripe's frames may need at the browser default", () => {
    expect(PERMISSIONS_POLICY).not.toHaveProperty('payment')
    expect(PERMISSIONS_POLICY).not.toHaveProperty('publickey-credentials-get')
  })

  it('writes a Permissions-Policy in the structured header syntax', () => {
    expect(
      serializePermissionsPolicy({
        camera: [],
        geolocation: ['self', 'https://maps.example.com'],
        fullscreen: ['self'],
      }),
    ).toBe(
      'camera=(), geolocation=(self "https://maps.example.com"), fullscreen=(self)',
    )
  })

  it("recognises Nuxt's error page render", () => {
    expect(isErrorPageRequest('/__nuxt_error?status=404&url=%2Fpl')).toBe(true)
    expect(isErrorPageRequest('/shop/__nuxt_error')).toBe(true)
    expect(isErrorPageRequest('/pl/products/__nuxt_error-shirt')).toBe(false)
    expect(isErrorPageRequest('/pl?next=/__nuxt_error')).toBe(false)
    expect(isErrorPageRequest(undefined)).toBe(false)
  })
})

describe('security headers plugin', () => {
  let cdnCacheHooks: Hooks
  let frameAncestorsHooks: Hooks
  let previewHooks: Hooks
  let securityHooks: Hooks
  // Nitro loads server/plugins in file order (checked in the built
  // .output/server/chunks/nitro/nitro.mjs): cdn-cache, frame-ancestors,
  // preview, security-headers
  let pluginsInFileOrder: Hooks[]

  beforeAll(async () => {
    installNitroGlobals()
    cdnCacheHooks = await loadPlugin(
      () => import('~~/server/plugins/cdn-cache'),
    )
    frameAncestorsHooks = await loadPlugin(
      () => import('~~/server/plugins/frame-ancestors'),
    )
    previewHooks = await loadPlugin(() => import('~~/server/plugins/preview'))
    securityHooks = await loadPlugin(
      () => import('~~/server/plugins/security-headers'),
    )
    pluginsInFileOrder = [
      cdnCacheHooks,
      frameAncestorsHooks,
      previewHooks,
      securityHooks,
    ]
  })

  beforeEach(() => {
    nitro.runtimeConfig = cspRuntimeConfig()
  })

  // What Nuxt's renderer does with a page: the render:response hooks of the
  // plugins, then the rendered headers on the response.
  // `cdnCache` is what app/plugins/cdn-cache.server.ts sets.
  const renderPage = (pluginHooks: Hooks[]) =>
    defineEventHandler((event) => {
      event.context.cdnCache = true
      const response: RenderResponse = {
        statusCode: 200,
        headers: { 'content-type': 'text/html;charset=utf-8' },
        body: '<!DOCTYPE html><html></html>',
      }
      runHooks(pluginHooks, 'render:response', response, { event })
      setResponseHeaders(event, response.headers ?? {})
      return response.body
    })

  // What Nuxt's error handler (@nuxt/nitro-server, handlers/error) does for a
  // page request: Nitro's default error headers without content-type and CSP,
  // then a request of its own to /__nuxt_error, whose headers it copies onto
  // the response.
  const nuxtErrorPage =
    (fetchApp: () => (path: string) => Promise<Response>) =>
    async (error: H3Error, event: H3Event) => {
      const defaultRes = defaultHandler(error, event, { json: true })
      delete defaultRes.headers['content-type']
      delete defaultRes.headers['content-security-policy']
      setResponseHeaders(event, defaultRes.headers)
      const res = await fetchApp()(
        `/__nuxt_error?status=${defaultRes.status}&url=${encodeURIComponent(event.path)}`,
      )
      res.headers.forEach((value, name) => {
        setResponseHeader(event, name, value)
      })
      setResponseStatus(event, defaultRes.status)
      return send(event, await res.text())
    }

  const createApp = (
    pluginHooks: Hooks[] = pluginsInFileOrder,
    { htmlErrors = false } = {},
  ) => {
    // The HTML error handler calls the app it belongs to
    const fetchApp: ReturnType<typeof createTestApp> = createTestApp(
      {
        get: {
          '/pl': renderPage(pluginHooks),
          '/pl/store': renderPage(pluginHooks),
          '/__nuxt_error': defineEventHandler((event) => {
            setResponseHeader(event, 'content-type', 'text/html;charset=utf-8')
            return '<!DOCTYPE html><html>error</html>'
          }),
          '/api/regions': defineEventHandler((event) => {
            setResponseHeader(
              event,
              'cache-control',
              's-maxage=600, stale-while-revalidate=3600',
            )
            return { regions: [] }
          }),
          '/api/preview/cms/:slug': defineEventHandler(() => ({ ok: true })),
          '/api/broken': defineEventHandler(() => {
            throw createError({ statusCode: 500, message: 'boom' })
          }),
          '/pl/products/missing': defineEventHandler(() => {
            throw createError({ statusCode: 404, message: 'Product not found' })
          }),
          '/old': defineEventHandler((event) => sendRedirect(event, '/pl')),
        },
      },
      {
        pluginHooks,
        onError: htmlErrors
          ? nuxtErrorPage(() => fetchApp)
          : (error, event) => nitroErrorHandler(error, event),
      },
    )
    return fetchApp
  }

  const securityHeaders = (response: Response) => ({
    'x-content-type-options': response.headers.get('x-content-type-options'),
    'referrer-policy': response.headers.get('referrer-policy'),
    'permissions-policy': response.headers.get('permissions-policy'),
    'content-security-policy-report-only': response.headers.get(
      'content-security-policy-report-only',
    ),
  })
  const DEFAULTS = {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': PERMISSIONS,
    'content-security-policy-report-only':
      buildContentSecurityPolicy(cspRuntimeConfig()),
  }

  it.each(['/pl', '/api/regions', '/old'])(
    'sends the headers on %s and keeps frame-ancestors',
    async (path) => {
      const response = await createApp()(path)

      expect(securityHeaders(response)).toEqual(DEFAULTS)
      expect(response.headers.get('content-security-policy')).toBe(
        DEFAULT_FRAME_ANCESTORS,
      )
    },
  )

  it('leaves the CDN cache header, the status and the location alone', async () => {
    const page = await createApp()('/pl')
    const redirect = await createApp()('/old')
    const api = await createApp()('/api/regions')

    expect(page.status).toBe(200)
    expect(page.headers.get('cdn-cache-control')).toBe(CDN)
    expect(redirect.status).toBe(302)
    expect(redirect.headers.get('location')).toBe('/pl')
    expect(api.headers.get('cache-control')).toBe(
      's-maxage=600, stale-while-revalidate=3600',
    )
  })

  it('sends the same headers to every visitor of a CDN cached page', async () => {
    const app = createApp()
    const visitors = await Promise.all([
      app('/pl/store'),
      app('/pl/store', {
        headers: { cookie: 'cart_id=cart_1; medusa_jwt=x', 'user-agent': 'a' },
      }),
      app('/pl/store?page=2', {
        headers: { 'accept-language': 'en', referer: 'https://x.test/' },
      }),
    ])

    const [first, ...others] = visitors.map(securityHeaders)
    expect(first).toEqual(DEFAULTS)
    others.forEach((headers) => expect(headers).toEqual(first))
    visitors.forEach((response) =>
      expect(response.headers.get('cdn-cache-control')).toBe(CDN),
    )
  })

  describe('a preview response keeps its stricter headers', () => {
    // The plugin's position must not matter: also loaded before preview.ts
    it.each([
      ['in file order', () => pluginsInFileOrder],
      [
        'before preview.ts',
        () => [cdnCacheHooks, frameAncestorsHooks, securityHooks, previewHooks],
      ],
    ])('%s', async (_order, plugins) => {
      const app = createApp(plugins())
      const page = await app('/pl?preview=1')
      const api = await app('/api/preview/cms/navigation?locale=pl')

      ;[page, api].forEach((response) => {
        expect(response.headers.get('referrer-policy')).toBe('no-referrer')
        expect(response.headers.get('cache-control')).toBe('private, no-store')
        expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
        expect(response.headers.get('content-security-policy')).toBe(
          PREVIEW_FRAME_ANCESTORS,
        )
        expect(response.headers.get('cdn-cache-control')).toBeNull()
        expect(response.headers.get('x-content-type-options')).toBe('nosniff')
        expect(response.headers.get('permissions-policy')).toBe(PERMISSIONS)
        expect(
          response.headers.get('content-security-policy-report-only'),
        ).toBe(DEFAULTS['content-security-policy-report-only'])
      })
    })
  })

  it("keeps Nitro's stricter headers on a JSON error", async () => {
    const response = await createApp()('/api/broken')

    expect(response.status).toBe(500)
    expect(response.headers.get('referrer-policy')).toBe('no-referrer')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
    expect(response.headers.get('content-security-policy')).toBe(
      "script-src 'none'; frame-ancestors 'none';",
    )
    expect(response.headers.get('permissions-policy')).toBe(PERMISSIONS)
  })

  it("keeps Nitro's stricter headers on Nuxt's HTML error page", async () => {
    const response = await createApp(pluginsInFileOrder, {
      htmlErrors: true,
    })('/pl/products/missing')

    expect(response.status).toBe(404)
    expect(await response.text()).toContain('error')
    // Without the /__nuxt_error exception the copied headers of the error
    // page's own request would bring strict-origin-when-cross-origin back
    expect(response.headers.get('referrer-policy')).toBe('no-referrer')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('content-security-policy')).toBe(
      DEFAULT_FRAME_ANCESTORS,
    )
    expect(response.headers.get('permissions-policy')).toBe(PERMISSIONS)
  })

  it('sends nothing on the error page render itself', async () => {
    const response = await createApp()('/__nuxt_error?status=404&url=%2Fpl')

    expect(securityHeaders(response)).toEqual({
      'x-content-type-options': null,
      'referrer-policy': null,
      'permissions-policy': null,
      'content-security-policy-report-only': null,
    })
  })

  it('sends the report-only policy as a header of its own, next to the enforced frame-ancestors', async () => {
    const response = await createApp()('/pl')
    const reportOnly = response.headers.get(
      'content-security-policy-report-only',
    )

    expect(response.headers.get('content-security-policy')).toBe(
      DEFAULT_FRAME_ANCESTORS,
    )
    expect(reportOnly).toContain("default-src 'self'")
    expect(reportOnly).toContain('https://api.example.com')
    expect(reportOnly).not.toContain('frame-ancestors')
    expect(response.headers.get('reporting-endpoints')).toBeNull()
  })

  it('reports to NUXT_CSP_REPORT_URI only when it is set', async () => {
    nitro.runtimeConfig = cspRuntimeConfig({
      reportUri: 'https://csp.example.com/report',
    })
    const response = await createApp()('/pl')

    expect(response.headers.get('reporting-endpoints')).toBe(
      'csp-endpoint="https://csp.example.com/report"',
    )
    expect(
      response.headers.get('content-security-policy-report-only'),
    ).toContain(
      'report-uri https://csp.example.com/report; report-to csp-endpoint',
    )
  })

  it('keeps a header another hook set before it', async () => {
    const earlier: Hooks = {
      request: [
        ((event: H3Event) =>
          setResponseHeader(event, 'referrer-policy', 'same-origin')) as Hook,
      ],
    }
    const response = await createApp([earlier, ...pluginsInFileOrder])(
      '/api/regions',
    )

    expect(response.headers.get('referrer-policy')).toBe('same-origin')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
  })
})
