import { beforeAll, describe, expect, it } from '@jest/globals'

type RenderResponse = {
  statusCode?: number
  headers?: Record<string, string>
}
type RenderResponseHook = (
  response: RenderResponse,
  context: { event: unknown },
) => void

describe('cdn cache plugin', () => {
  let onRenderResponse: RenderResponseHook

  beforeAll(async () => {
    Object.assign(globalThis, {
      defineNitroPlugin: (plugin: unknown) => plugin,
    })
    const module = await import('../../../server/plugins/cdn-cache')
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
  const render = ({ cdnCache = true, statusCode = 200, setCookie = false }) => {
    const response: RenderResponse = {
      statusCode,
      headers: { 'content-type': 'text/html;charset=utf-8' },
    }
    onRenderResponse(response, {
      event: {
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
    expect(render({})).toBe('max-age=60, stale-while-revalidate=300')
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
})
