import { beforeAll, describe, expect, it } from 'vitest'

type Headers = Record<string, string>
type FakeEvent = { node: { res: { headers: Headers; statusCode: number } } }
type RequestHook = (event: FakeEvent) => void

const POLICY = "frame-ancestors 'self'"

describe('frame-ancestors plugin', () => {
  let onRequest: RequestHook

  beforeAll(async () => {
    // Nitro auto-imports these (and defineNitroPlugin) in server code. The
    // fakes store headers the way h3 does: lower-cased names, last write wins.
    Object.assign(globalThis, {
      defineNitroPlugin: (plugin: unknown) => plugin,
      getResponseHeader: (event: FakeEvent, name: string) =>
        event.node.res.headers[name.toLowerCase()],
      setResponseHeader: (event: FakeEvent, name: string, value: string) => {
        event.node.res.headers[name.toLowerCase()] = value
      },
    })
    const module = await import('~~/server/plugins/frame-ancestors')
    const plugin = module.default as unknown as (nitroApp: unknown) => void
    plugin({
      hooks: {
        hook: (name: string, handler: RequestHook) => {
          if (name === 'request') onRequest = handler
        },
      },
    })
  })

  // The hook runs when the request arrives, before any handler; `respond`
  // then plays what the handler (or Nitro's error handler) does to the
  // response headers, and the headers the browser would see are returned.
  const request = (
    respond: (headers: Headers, event: FakeEvent) => void = () => {},
    initial: Headers = {},
  ) => {
    const event: FakeEvent = {
      node: { res: { headers: { ...initial }, statusCode: 200 } },
    }
    onRequest(event)
    respond(event.node.res.headers, event)
    return event.node.res
  }

  it('sets the policy on an HTML page', () => {
    const res = request((headers) => {
      headers['content-type'] = 'text/html;charset=utf-8'
    })

    expect(res.headers['content-security-policy']).toBe(POLICY)
  })

  it('sets the policy on a JSON API response', () => {
    const res = request((headers) => {
      headers['content-type'] = 'application/json'
    })

    expect(res.headers['content-security-policy']).toBe(POLICY)
  })

  it('sets the policy on an error response', () => {
    // h3's sendError and Nitro's error handler only add headers, none are
    // removed (checked against a built server, see "Security headers" in
    // CLAUDE.md); Nitro's own handler may swap the value for a stricter one.
    const res = request((headers, event) => {
      event.node.res.statusCode = 500
      headers['content-type'] = 'application/json'
    })

    expect(res.statusCode).toBe(500)
    expect(res.headers['content-security-policy']).toBe(POLICY)
  })

  it('sets the policy on a redirect and leaves its location alone', () => {
    const res = request((headers, event) => {
      event.node.res.statusCode = 302
      headers.location = '/pl/store'
    })

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/pl/store')
    expect(res.headers['content-security-policy']).toBe(POLICY)
  })

  it('does not touch the CDN cache header or cookies', () => {
    const res = request(
      (headers) => {
        headers['cdn-cache-control'] = 'max-age=60, stale-while-revalidate=300'
      },
      { 'set-cookie': 'cart_id=abc' },
    )

    expect(res.headers['cdn-cache-control']).toBe(
      'max-age=60, stale-while-revalidate=300',
    )
    expect(res.headers['set-cookie']).toBe('cart_id=abc')
    expect(Object.keys(res.headers).sort()).toEqual([
      'cdn-cache-control',
      'content-security-policy',
      'set-cookie',
    ])
  })

  it('sends one header and no X-Frame-Options', () => {
    const res = request()

    expect(res.headers['content-security-policy']).toBe(POLICY)
    expect(res.headers['x-frame-options']).toBeUndefined()
  })

  it('lets a response replace the policy with its own', () => {
    const own = "frame-ancestors 'self' https://admin.example.com"
    const res = request((headers) => {
      headers['content-security-policy'] = own
    })

    expect(res.headers['content-security-policy']).toBe(own)
  })

  it('keeps a policy that was set before the plugin ran', () => {
    const earlier = "default-src 'self'; frame-ancestors 'none'"
    const res = request(undefined, { 'content-security-policy': earlier })

    expect(res.headers['content-security-policy']).toBe(earlier)
  })
})
