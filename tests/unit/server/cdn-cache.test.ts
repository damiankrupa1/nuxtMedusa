import { beforeAll, describe, expect, it } from 'vitest'

type RenderResponse = {
  statusCode?: number
  headers?: Record<string, string>
}
type RenderResponseHook = (
  response: RenderResponse,
  context: { event: unknown },
) => void

const SHARED = 'max-age=60, stale-while-revalidate=300'

describe('cdn cache plugin', () => {
  let onRenderResponse: RenderResponseHook

  beforeAll(async () => {
    Object.assign(globalThis, {
      defineNitroPlugin: (plugin: unknown) => plugin,
    })
    const module = await import('~~/server/plugins/cdn-cache')
    const plugin = module.default as unknown as (nitroApp: unknown) => void
    plugin({
      hooks: {
        hook: (_name: string, handler: RenderResponseHook) => {
          onRenderResponse = handler
        },
      },
    })
  })

  // Renders a response and returns the CDN cache header it ends up with
  const render = ({
    cdnCache = true,
    statusCode = 200,
    setCookie = false,
    path = '/pl/products/some-shirt',
  }) => {
    const response: RenderResponse = {
      statusCode,
      headers: { 'content-type': 'text/html;charset=utf-8' },
    }
    onRenderResponse(response, {
      event: {
        path,
        context: { cdnCache },
        node: {
          res: {
            statusCode,
            hasHeader: (name: string) => setCookie && name === 'set-cookie',
          },
        },
      },
    })
    return response.headers?.['cdn-cache-control']
  }

  it('lets the CDN share the pages that opted in', () => {
    expect(render({})).toBe(SHARED)
    expect(render({ path: '/pl/store?page=2&sortBy=price' })).toBe(SHARED)
  })

  it('keeps the other pages out of the CDN', () => {
    expect(render({ cdnCache: false })).toBeUndefined()
  })

  it('never shares redirects or errors', () => {
    expect(render({ statusCode: 302 })).toBeUndefined()
    expect(render({ statusCode: 404 })).toBeUndefined()
    expect(render({ statusCode: 500 })).toBeUndefined()
  })

  it('never shares a response that sets a cookie', () => {
    expect(render({ setCookie: true })).toBeUndefined()
  })

  // Nuxt renders its error page as a request to /__nuxt_error, which this hook
  // sees as a 200: the 500, or the 404 of a missing product handle, is applied
  // to the response that carries the page afterwards
  it('never shares an error page rendered with status 200', () => {
    const query =
      '?status=500&statusText=Server%20Error&url=%2Fpl%2Fproducts%2Fx'
    expect(render({ path: `/__nuxt_error${query}` })).toBeUndefined()
    expect(render({ path: '/__nuxt_error' })).toBeUndefined()
    expect(render({ path: `/shop/__nuxt_error${query}` })).toBeUndefined()
  })

  it('does not mistake a page for the error page', () => {
    expect(render({ path: '/pl/products/__nuxt_error-shirt' })).toBe(SHARED)
    expect(render({ path: '/pl/store?next=/__nuxt_error' })).toBe(SHARED)
  })
})
