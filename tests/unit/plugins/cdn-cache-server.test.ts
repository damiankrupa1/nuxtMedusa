import { beforeAll, describe, expect, it } from 'vitest'

type SsrContext = {
  error: boolean
  payload: { error?: unknown }
  event: { context: { cdnCache?: boolean } }
}
type RenderedHook = (args: { ssrContext?: SsrContext }) => void

describe('cdn cache page plugin', () => {
  let onRendered: RenderedHook
  let routeMeta: { cdnCache?: boolean }

  beforeAll(async () => {
    // Nuxt auto-imports these into app code; the fakes hand the plugin a router
    // whose current route we control and capture the app:rendered hook.
    Object.assign(globalThis, {
      defineNuxtPlugin: (plugin: unknown) => plugin,
      useRouter: () => ({
        currentRoute: {
          get value() {
            return { meta: routeMeta }
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
  } = {}) => {
    routeMeta = { cdnCache }
    const ssrContext: SsrContext = {
      error,
      payload: { error: payloadError },
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

  // Nitro renders the error page for the failed URL, so the route resolves to
  // the catalog page that opted in again
  it('does not mark the error page rendered for a failed page', () => {
    expect(render({ error: true })).toBeUndefined()
    expect(
      render({ error: true, payloadError: { statusCode: 500 } }),
    ).toBeUndefined()
  })

  it('does nothing without an SSR context', () => {
    routeMeta = { cdnCache: true }
    expect(() => onRendered({})).not.toThrow()
  })
})
