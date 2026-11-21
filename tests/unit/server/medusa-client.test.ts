// @vitest-environment node
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import Medusa from '@medusajs/js-sdk'
import type { H3Event } from 'h3'

import {
  buildServerMedusaConfig,
  serverMedusaClient,
} from '~~/server/utils/medusa'

// The server API routes' Medusa client (#89, replacing @nuxtjs/medusa's
// serverMedusaClient). It is built from the same public runtime config as the
// page's client, but with JWT auth that stores nothing (#82), and once per
// request. Only the network is fake: the requests are the installed SDK's.

const medusaConfig = {
  backendUrl: 'http://medusa.test',
  publishableKey: 'pk_test',
}
const useRuntimeConfig = vi.fn(() => ({ public: { medusa: medusaConfig } }))
const newEvent = () => ({ context: {} }) as H3Event

const network = vi.fn<(input: URL, init: RequestInit) => Promise<Response>>()
const requests = () =>
  network.mock.calls.map(
    ([input, init]) => `${init.method ?? 'GET'} ${new URL(input).pathname}`,
  )
const sentHeaders = (call: number) =>
  new Headers(network.mock.calls[call]?.[1].headers)

beforeAll(() => {
  // A Nitro auto-import in server code
  Object.assign(globalThis, { useRuntimeConfig })
})

beforeEach(() => {
  vi.clearAllMocks()
  network.mockImplementation(async () =>
    Response.json({ token: 'jwt', regions: [] }),
  )
  vi.stubGlobal('fetch', network)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildServerMedusaConfig', () => {
  it('uses the backend and key of the public config with JWT auth that stores no token', () => {
    expect(buildServerMedusaConfig(medusaConfig)).toEqual({
      baseUrl: 'http://medusa.test',
      publishableKey: 'pk_test',
      debug: false,
      auth: { type: 'jwt', jwtTokenStorageMethod: 'nostore' },
    })
  })
})

describe('serverMedusaClient', () => {
  it('builds an SDK client from the runtime config of the request', () => {
    const event = newEvent()

    expect(serverMedusaClient(event)).toBeInstanceOf(Medusa)
    expect(useRuntimeConfig).toHaveBeenCalledWith(event)
  })

  it('gives every caller of one request the same client, kept on the event', () => {
    const event = newEvent()

    const client = serverMedusaClient(event)

    expect(serverMedusaClient(event)).toBe(client)
    expect(event.context.medusa).toBe(client)
    expect(useRuntimeConfig).toHaveBeenCalledTimes(1)
  })

  it('never shares a client between requests', () => {
    expect(serverMedusaClient(newEvent())).not.toBe(
      serverMedusaClient(newEvent()),
    )
  })

  it('asks the configured backend with the publishable key, without cookies or a token', async () => {
    await serverMedusaClient(newEvent()).store.region.list()

    expect(String(network.mock.calls[0]?.[0])).toBe(
      'http://medusa.test/store/regions',
    )
    expect(sentHeaders(0).get('x-publishable-api-key')).toBe('pk_test')
    expect(sentHeaders(0).has('authorization')).toBe(false)
    // `include` would be the session type's mode
    expect(network.mock.calls[0]?.[1].credentials).toBe('omit')
  })

  // #82: with the page client's `auth.type: 'session'` the SDK's login
  // followed the token with POST /auth/session, a Medusa cookie session
  // nothing used or ended
  it("lets the SDK's login ask for the token alone and keep nothing on the client", async () => {
    const medusa = serverMedusaClient(newEvent())

    await expect(
      medusa.auth.login('customer', 'emailpass', {
        email: 'ada@example.com',
        password: 'secret',
      }),
    ).resolves.toBe('jwt')
    await medusa.store.region.list()

    expect(requests()).toEqual([
      'POST /auth/customer/emailpass',
      'GET /store/regions',
    ])
    // The next call of the same client doesn't carry the token
    expect(sentHeaders(1).has('authorization')).toBe(false)
  })

  // With 'local' storage auth.register() stored the token in localStorage
  // without awaiting it: an unhandled rejection on the server, which Vitest
  // reports as a failure
  it("lets the SDK's register ask for the token alone, without an unhandled rejection", async () => {
    const medusa = serverMedusaClient(newEvent())

    await expect(
      medusa.auth.register('customer', 'emailpass', {
        email: 'ada@example.com',
        password: 'secret1',
      }),
    ).resolves.toBe('jwt')
    await medusa.store.region.list()

    expect(requests()).toEqual([
      'POST /auth/customer/emailpass/register',
      'GET /store/regions',
    ])
    expect(sentHeaders(1).has('authorization')).toBe(false)
  })

  it('sends the token a call passes itself', async () => {
    await serverMedusaClient(newEvent()).store.customer.retrieve(
      {},
      { Authorization: 'Bearer customer-token' },
    )

    expect(requests()).toEqual(['GET /store/customers/me'])
    expect(sentHeaders(0).get('authorization')).toBe('Bearer customer-token')
  })
})
