import { createServer } from 'node:http'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { payloadGlobals, payloadImage } from '~~/tests/fixtures/cms'
import { testData } from '~~/tests/e2e/support/test-data'
import { CMS_GLOBAL_SLUGS } from '~/types/cms'
import type { CmsGlobalSlug } from '~/types/cms'

// A local stand-in for Payload's REST API, so the e2e suite needs no Payload
// instance: it answers `GET /api/globals/<slug>` with the global the storefront
// reads (the same shapes as tests/fixtures/cms.ts, which the unit tests use,
// with the handles the Medusa seed provides) and serves one 1x1 image.
//
// It deliberately sends NO CORS headers, like the real Payload instance (see
// "Payload CMS integration" in CLAUDE.md): a storefront that calls it from the
// browser instead of through the server/api/cms proxy gets the request
// blocked, which is the bug the home page regression spec (#42) guards.

export const STUB_IMAGE_PATH = '/media/e2e-pixel.png'

// 1x1 transparent PNG
const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

export interface StubRequest {
  method: string
  path: string
  query: Record<string, string>
}

// The fixtures link to categories/products of the unit tests; the e2e Medusa
// seed has its own handles (test-data.ts).
function buildGlobals(): Record<CmsGlobalSlug, unknown> {
  const categoryTiles = payloadGlobals['category-tiles']
  const shopTheLook = payloadGlobals['shop-the-look']

  return {
    ...payloadGlobals,
    'category-tiles': {
      ...categoryTiles,
      cards: categoryTiles.cards.map((card) => ({
        ...card,
        categoryHandle: testData.categoryHandle,
      })),
    },
    'shop-the-look': {
      ...shopTheLook,
      productHandles: testData.shopTheLookHandles,
    },
  }
}

export interface PayloadStub {
  url: string
  close: () => Promise<void>
}

export async function startPayloadStub(port: number): Promise<PayloadStub> {
  const globals = buildGlobals()
  const requests: StubRequest[] = []
  let origin = ''

  const server: Server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://stub.invalid')
    const method = request.method ?? 'GET'
    const sendJson = (status: number, body: unknown) => {
      response.writeHead(status, { 'content-type': 'application/json' })
      response.end(JSON.stringify(body))
    }

    if (url.pathname === '/__stub/health') {
      return sendJson(200, { ok: true })
    }
    // What the storefront asked for, so a spec can check the proxy forwarded
    // the locale and depth. Not part of Payload's API.
    if (url.pathname === '/__stub/requests') {
      return sendJson(200, requests)
    }

    requests.push({
      method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
    })

    // A preflight gets no Access-Control-* headers either: this origin never
    // allows a cross-origin browser call.
    if (method === 'OPTIONS') {
      response.writeHead(204)
      return response.end()
    }

    if (method === 'GET' && url.pathname === STUB_IMAGE_PATH) {
      response.writeHead(200, {
        'content-type': 'image/png',
        'content-length': PIXEL_PNG.length,
      })
      return response.end(PIXEL_PNG)
    }

    const globalMatch = url.pathname.match(/^\/api\/globals\/([^/]+)$/)
    if (method === 'GET' && globalMatch) {
      const slug = globalMatch[1] as CmsGlobalSlug
      if (!CMS_GLOBAL_SLUGS.includes(slug)) {
        return sendJson(404, { errors: [{ message: 'Not Found' }] })
      }

      // The fixtures' image points at an example host; serve it from here
      return sendJson(
        200,
        JSON.parse(
          JSON.stringify(globals[slug]).replaceAll(
            payloadImage.url,
            `${origin}${STUB_IMAGE_PATH}`,
          ),
        ),
      )
    }

    return sendJson(404, { errors: [{ message: 'Not Found' }] })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  return {
    url: origin,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
        server.closeAllConnections()
      }),
  }
}
