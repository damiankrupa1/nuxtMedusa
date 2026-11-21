import { beforeAll, describe, expect, it } from 'vitest'

type SsrContext = {
  error: boolean
  payload: { error?: unknown; _errors?: Record<string, unknown> }
  event: { context: { cdnCache?: boolean } }
}
type RenderedHook = (args: { ssrContext?: SsrContext }) => void

describe('cdn cache page plugin', () => {
  let onRendered: RenderedHook
  let routeMeta: { cdnCache?: boolean }
  let routeQuery: Record<string, string | null>

  beforeAll(async () => {
    // Nuxt auto-imports these into app code; the fakes hand the plugin a router
    // whose current route we control and capture the app:rendered hook.
    Object.assign(globalThis, {
      defineNuxtPlugin: (plugin: unknown) => plugin,
      useRouter: () => ({
        currentRoute: {
          get value() {
            return { meta: routeMeta, query: routeQuery }
          },
        },
      }),
    })
    const module = await import('~/plugins/cdn-cache.server')
    const plugin = module.default as unknown as (nuxtApp: unknown) => void
    plugin({
      hook: (name: string, handler: RenderedHook) => {
        if (name === 'app:rendered') onRendered = handler
      },
    })
  })

  // Finishes a render and returns whether the request ended up marked
  const render = ({
    cdnCache = true,
    error = false,
    payloadError = undefined as unknown,
    dataErrors = undefined as Record<string, unknown> | undefined,
    query = {} as Record<string, string | null>,
  } = {}) => {
    routeMeta = { cdnCache }
    routeQuery = query
    const ssrContext: SsrContext = {
      error,
      payload: { error: payloadError, _errors: dataErrors },
      event: { context: {} },
    }
    onRendered({ ssrContext })
    return ssrContext.event.context.cdnCache
  }

  it('marks a page that opted in', () => {
    expect(render()).toBe(true)
  })

  it('leaves a page that did not opt in alone', () => {
    expect(render({ cdnCache: false })).toBeUndefined()
  })

  it('does not mark a page that failed, e.g. a 500 from a missing backend', () => {
    expect(render({ payloadError: { statusCode: 500 } })).toBeUndefined()
  })

  it('does not mark a missing handle, the 404 of useNotFoundWhenMissing', () => {
    expect(
      render({
        payloadError: { statusCode: 404, statusMessage: 'Product not found' },
      }),
    ).toBeUndefined()
  })

  // #75: with Medusa down the page still renders, as a 200 with empty
  // sections; only the failed useLazyAsyncData calls record it
  it('does not mark a page whose data failed to load', () => {
    const fetchFailed = { statusCode: 500, message: 'fetch failed' }
    expect(
      render({
        dataErrors: { countries: fetchFailed, 'cms:footer:pl': undefined },
      }),
    ).toBeUndefined()
    expect(
      render({
        dataErrors: {
          countries: undefined,
          'products:undefined:undefined:undefined:12:0:reg_pl:pl-PL':
            fetchFailed,
        },
      }),
    ).toBeUndefined()
  })

  it('marks a page whose data all loaded', () => {
    expect(
      render({
        dataErrors: { countries: undefined, 'cms:footer:pl': undefined },
      }),
    ).toBe(true)
    expect(render({ dataErrors: {} })).toBe(true)
  })

  // Nitro renders the error page for the failed URL, so the route resolves to
  // the catalog page that opted in again
  it('does not mark the error page rendered for a failed page', () => {
    expect(render({ error: true })).toBeUndefined()
    expect(
      render({ error: true, payloadError: { statusCode: 500 } }),
    ).toBeUndefined()
  })

  // The draft preview (#53): ?preview marks the request as a preview, whatever
  // its value; it is never shared
  it('does not mark a preview request', () => {
    expect(render({ query: { preview: '1' } })).toBeUndefined()
    expect(render({ query: { preview: null } })).toBeUndefined()
    expect(render({ query: { page: '2' } })).toBe(true)
  })

  it('does nothing without an SSR context', () => {
    routeMeta = { cdnCache: true }
    routeQuery = {}
    expect(() => onRendered({})).not.toThrow()
  })
})
