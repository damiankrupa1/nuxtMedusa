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
import type { EventHandler, H3Error } from 'h3'
import {
  createApp,
  createError,
  createRouter,
  defineEventHandler,
  deleteCookie,
  getCookie,
  getRequestProtocol,
  isError,
  readBody,
  setCookie,
  toWebHandler,
} from 'h3'
import { FetchError } from '@medusajs/js-sdk'

import * as Sentry from '@sentry/nuxt'
import { serverMedusaClient } from '#medusa/server'
import { defineWrappedResponseHandler } from '~~/server/utils/handler'

// The session contract of server/api/customers/** as the storefront sees it:
// paths, methods, statuses, response bodies, the exact `Set-Cookie` header of
// `medusa_jwt` and the Medusa SDK calls. The requests go through a real h3 app
// with h3's own cookie and body helpers, so the cookie attributes are the ones
// Nitro sends. Only the Medusa SDK client is faked (behind the
// `#medusa/server` alias), not the customer repository: these tests were run
// against the handlers before and after the repository was extracted, which
// is what shows that the extraction changed nothing a caller can observe.
//
// Issue #78 changed the contract on purpose: the cookie is HttpOnly and
// SameSite=Lax, lives as long as the token (Max-Age), and is Secure when the
// request came over https (`x-forwarded-proto`, as behind Vercel's edge); a
// failed second step of login/register clears it; GET me without a cookie
// doesn't ask Medusa.
//
// Issue #82 changed only the Medusa side of login and register: they ask the
// token routes directly, so no Medusa cookie session is opened. Statuses,
// bodies and `Set-Cookie` stayed as they were.

// Login and register ask Medusa's token routes through `client.fetch`; the
// SDK's auth.login()/auth.register() are faked only to show they are never
// called (#82: with the server client's config they open a Medusa session).
const medusa = {
  client: { fetch: vi.fn() },
  auth: { login: vi.fn(), register: vi.fn() },
  store: {
    customer: { retrieve: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}

const customer = { id: 'cus_test', email: 'ada@example.com' }
const signin = { email: 'ada@example.com', password: 'secret' }
const registration = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  phone: '+48 600 000 000',
  password: 'secret1',
}

let request: (path: string, init?: RequestInit) => Promise<Response>

// The error a handler threw. h3's bare app leaves the message out of the JSON
// error body (Nitro's error handler puts it in), so the message is asserted
// on the thrown H3 error instead.
let lastError: H3Error | undefined
const failure = () => lastError

beforeAll(async () => {
  // Nitro auto-imports these in server code
  Object.assign(globalThis, {
    createError,
    isError,
    defineEventHandler,
    defineWrappedResponseHandler,
    readBody,
    getCookie,
    setCookie,
    deleteCookie,
    getRequestProtocol,
  })

  // Imported after the globals above: the handlers call them when defined
  const handler = (module: { default: EventHandler }) => module.default
  const router = createRouter()
    .post(
      '/api/customers/login',
      handler(await import('~~/server/api/customers/login.post')),
    )
    .post(
      '/api/customers/register',
      handler(await import('~~/server/api/customers/register.post')),
    )
    .delete(
      '/api/customers/logout',
      handler(await import('~~/server/api/customers/logout.delete')),
    )
    .get(
      '/api/customers/me',
      handler(await import('~~/server/api/customers/me.get')),
    )
    .post(
      '/api/customers/me',
      handler(await import('~~/server/api/customers/me.post')),
    )
  const app = createApp({
    onError: (error) => {
      lastError = error
    },
  })
  const handle = toWebHandler(app.use(router))

  request = (path, init) => handle(new Request(`http://localhost${path}`, init))
})

beforeEach(() => {
  vi.clearAllMocks()
  lastError = undefined
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.mocked(Sentry.isEnabled).mockReturnValue(true)
  vi.mocked(serverMedusaClient).mockReturnValue(medusa)
  medusa.client.fetch.mockImplementation(async (path: string) => ({
    token: path.endsWith('/register')
      ? 'register-token'
      : path === '/auth/token/refresh'
        ? 'session-token'
        : 'login-token',
  }))
  medusa.store.customer.retrieve.mockResolvedValue({ customer })
  medusa.store.customer.create.mockResolvedValue({ customer })
  medusa.store.customer.update.mockResolvedValue({ customer })
})

afterEach(() => {
  vi.useRealTimers()
})

// What the TLS-terminating proxy in front of the function (Vercel's edge)
// adds to a request that reached it over https
const overHttps = { 'x-forwarded-proto': 'https' }

const post = (
  path: string,
  body: unknown,
  cookie?: string,
  headers: Record<string, string> = {},
) =>
  request(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
  })

const get = (path: string, cookie?: string) =>
  request(path, cookie ? { headers: { cookie } } : undefined)

const logout = (headers: Record<string, string> = {}) =>
  request('/api/customers/logout', { method: 'DELETE', headers })

const medusaError = (status: number, message: string) =>
  new FetchError(message, 'Medusa', status)

// An unsigned token with the given claims: only its `exp` is read here (for
// the cookie's lifetime); Medusa alone verifies the signature
const base64url = (value: string) =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const jwt = (claims: Record<string, unknown>) =>
  [
    base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    base64url(JSON.stringify(claims)),
    'signature',
  ].join('.')

// The exact headers, attributes in the order h3 serialises them. The plain
// test tokens ('login-token', ...) carry no `exp`, so their cookie gets the
// 24 hours of Medusa's default `jwtExpiresIn`.
const sessionCookie = (token: string, maxAge = 86400) =>
  `medusa_jwt=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax`
const secureSessionCookie = (token: string, maxAge = 86400) =>
  `medusa_jwt=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`
const clearedSessionCookie =
  'medusa_jwt=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax'
const clearedSecureSessionCookie =
  'medusa_jwt=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'

const sentryEvents = () => vi.mocked(Sentry.captureException).mock.calls.length
const sentryBreadcrumbs = () =>
  vi.mocked(Sentry.addBreadcrumb).mock.calls.length

describe('POST /api/customers/login', () => {
  it('signs in, sets the session cookie and answers the customer', async () => {
    const response = await post('/api/customers/login', signin)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ customer })
    // HttpOnly and SameSite=Lax always; no Secure on a plain http request
    // (local dev, `pnpm preview`)
    expect(response.headers.getSetCookie()).toEqual([
      sessionCookie('login-token'),
    ])
    expect(medusa.client.fetch).toHaveBeenCalledWith(
      '/auth/customer/emailpass',
      {
        method: 'POST',
        body: { email: 'ada@example.com', password: 'secret' },
      },
    )
    // One Medusa call for the token, no POST /auth/session (#82)
    expect(medusa.client.fetch).toHaveBeenCalledTimes(1)
    expect(medusa.auth.login).not.toHaveBeenCalled()
    expect(medusa.store.customer.retrieve).toHaveBeenCalledWith(
      {},
      { Authorization: 'Bearer login-token' },
    )
    expect(sentryEvents()).toBe(0)
  })

  it('marks the cookie Secure when the request came over https', async () => {
    const response = await post(
      '/api/customers/login',
      signin,
      undefined,
      overHttps,
    )

    expect(response.status).toBe(200)
    expect(response.headers.getSetCookie()).toEqual([
      secureSessionCookie('login-token'),
    ])
  })

  it('lets the cookie live exactly as long as the token', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-16T12:00:00Z'))
    const now = Math.floor(Date.now() / 1000)
    const token = jwt({ actor_id: 'cus_test', exp: now + 3600 })
    medusa.client.fetch.mockResolvedValue({ token })

    const response = await post('/api/customers/login', signin)

    expect(response.headers.getSetCookie()).toEqual([
      sessionCookie(token, 3600),
    ])
  })

  it('forwards only the email and the password to Medusa', async () => {
    await post('/api/customers/login', { ...signin, actor_type: 'user' })

    expect(medusa.client.fetch).toHaveBeenCalledWith(
      '/auth/customer/emailpass',
      {
        method: 'POST',
        body: { email: 'ada@example.com', password: 'secret' },
      },
    )
  })

  it('answers 400 with the issues for an invalid body, without calling Medusa', async () => {
    const response = await post('/api/customers/login', {
      email: 'not-an-email',
      password: '',
    })

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(failure()?.message).toBe('Invalid request body')
    expect(Object.keys(body.data.fieldErrors)).toEqual(['email', 'password'])
    expect(response.headers.getSetCookie()).toEqual([])
    expect(medusa.client.fetch).not.toHaveBeenCalled()
    expect(sentryEvents()).toBe(0)
  })

  it('keeps the status and message of rejected credentials, sets no cookie and only leaves a breadcrumb', async () => {
    medusa.client.fetch.mockRejectedValue(
      medusaError(401, 'Invalid email or password'),
    )

    const response = await post('/api/customers/login', signin)

    expect(response.status).toBe(401)
    expect(failure()?.message).toBe('Invalid email or password')
    expect(response.headers.getSetCookie()).toEqual([])
    expect(medusa.store.customer.retrieve).not.toHaveBeenCalled()
    expect(sentryEvents()).toBe(0)
    expect(sentryBreadcrumbs()).toBe(1)
  })

  it('answers 500 and sets no cookie when Medusa answers without a token (third-party login)', async () => {
    medusa.client.fetch.mockResolvedValue({ location: 'https://idp.example' })

    const response = await post('/api/customers/login', signin)

    expect(response.status).toBe(500)
    expect(failure()?.message).toBe('Unexpected login response from Medusa')
    expect(response.headers.getSetCookie()).toEqual([])
    expect(medusa.store.customer.retrieve).not.toHaveBeenCalled()
    expect(sentryEvents()).toBe(1)
  })

  it('answers an error, not `{ customer: null }`, and clears the cookie when Medusa rejects the fresh token', async () => {
    medusa.store.customer.retrieve.mockRejectedValue(
      medusaError(401, 'Unauthorized'),
    )

    const response = await post('/api/customers/login', signin)

    expect(response.status).toBe(401)
    expect(failure()?.message).toBe('Unauthorized')
    expect(response.headers.getSetCookie()).toEqual([clearedSessionCookie])
    expect(sentryEvents()).toBe(0)
    expect(sentryBreadcrumbs()).toBe(1)
  })

  it('clears the session cookie when retrieving the customer fails, keeps the status and reports once', async () => {
    medusa.store.customer.retrieve.mockRejectedValue(
      medusaError(500, 'Medusa is down'),
    )

    const response = await post(
      '/api/customers/login',
      signin,
      'medusa_jwt=earlier-session',
      overHttps,
    )

    expect(response.status).toBe(500)
    expect(failure()?.message).toBe('Medusa is down')
    // Also drops a session the browser had before this attempt
    expect(response.headers.getSetCookie()).toEqual([
      clearedSecureSessionCookie,
    ])
    expect(sentryEvents()).toBe(1)
  })
})

describe('POST /api/customers/register', () => {
  it("registers the identity, creates the customer with its token and keeps the customer's token as the session", async () => {
    const response = await post('/api/customers/register', registration)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ customer })
    // The registration token has no actor_id and Medusa refuses it for `me`,
    // so the session is the token refreshed once the customer exists
    expect(response.headers.getSetCookie()).toEqual([
      sessionCookie('session-token'),
    ])
    expect(medusa.client.fetch).toHaveBeenCalledWith(
      '/auth/customer/emailpass/register',
      {
        method: 'POST',
        body: { email: 'ada@example.com', password: 'secret1' },
      },
    )
    expect(medusa.auth.register).not.toHaveBeenCalled()
    expect(medusa.store.customer.create).toHaveBeenCalledWith(
      {
        email: 'ada@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
        phone: '+48 600 000 000',
      },
      {},
      { Authorization: 'Bearer register-token' },
    )
    expect(medusa.client.fetch).toHaveBeenLastCalledWith(
      '/auth/token/refresh',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer register-token' },
      },
    )
    expect(sentryEvents()).toBe(0)
  })

  it('marks the cookie Secure when the request came over https', async () => {
    const response = await post(
      '/api/customers/register',
      registration,
      undefined,
      overHttps,
    )

    expect(response.headers.getSetCookie()).toEqual([
      secureSessionCookie('session-token'),
    ])
  })

  it('creates the customer without a phone when none is given', async () => {
    const { phone: _phone, ...withoutPhone } = registration

    await post('/api/customers/register', withoutPhone)

    expect(medusa.store.customer.create).toHaveBeenCalledWith(
      {
        email: 'ada@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
        phone: undefined,
      },
      {},
      { Authorization: 'Bearer register-token' },
    )
  })

  it('answers 400 for an invalid body, without calling Medusa or setting a cookie', async () => {
    const response = await post('/api/customers/register', {
      ...registration,
      password: '123',
    })

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(failure()?.message).toBe('Invalid request body')
    expect(Object.keys(body.data.fieldErrors)).toEqual(['password'])
    expect(response.headers.getSetCookie()).toEqual([])
    expect(medusa.client.fetch).not.toHaveBeenCalled()
  })

  it('keeps the status of a rejected registration and sets no cookie', async () => {
    medusa.client.fetch.mockRejectedValue(
      medusaError(401, 'Identity with email already exists'),
    )

    const response = await post('/api/customers/register', registration)

    expect(response.status).toBe(401)
    expect(failure()?.message).toBe('Identity with email already exists')
    expect(response.headers.getSetCookie()).toEqual([])
    expect(medusa.store.customer.create).not.toHaveBeenCalled()
    expect(sentryEvents()).toBe(0)
  })

  it("clears the session cookie when creating the customer fails, keeping Medusa's status and message", async () => {
    medusa.store.customer.create.mockRejectedValue(
      medusaError(400, 'Customer already exists'),
    )

    const response = await post('/api/customers/register', registration)

    expect(response.status).toBe(400)
    expect(failure()?.message).toBe('Customer already exists')
    expect(response.headers.getSetCookie()).toEqual([clearedSessionCookie])
    expect(sentryEvents()).toBe(0)
    expect(sentryBreadcrumbs()).toBe(1)
  })

  it('clears the session cookie when the token refresh fails, keeping its status', async () => {
    medusa.client.fetch.mockImplementation(async (path: string) => {
      if (path === '/auth/token/refresh') {
        throw medusaError(401, 'Unauthorized')
      }
      return { token: 'register-token' }
    })

    const response = await post('/api/customers/register', registration)

    expect(response.status).toBe(401)
    expect(response.headers.getSetCookie()).toEqual([clearedSessionCookie])
    expect(medusa.store.customer.create).toHaveBeenCalled()
  })

  it('reports a failed second step once', async () => {
    medusa.store.customer.create.mockRejectedValue(
      medusaError(500, 'Medusa is down'),
    )

    const response = await post('/api/customers/register', registration)

    expect(response.status).toBe(500)
    expect(response.headers.getSetCookie()).toEqual([clearedSessionCookie])
    expect(sentryEvents()).toBe(1)
  })
})

describe('DELETE /api/customers/logout', () => {
  it('expires the session cookie with the attributes it was set with, without calling Medusa', async () => {
    const response = await logout({ cookie: 'medusa_jwt=login-token' })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
    expect(response.headers.getSetCookie()).toEqual([clearedSessionCookie])
    // Medusa can't revoke its JWT (see logout.delete.ts)
    expect(serverMedusaClient).not.toHaveBeenCalled()
  })

  it('expires the Secure cookie over https', async () => {
    const response = await logout({
      cookie: 'medusa_jwt=login-token',
      ...overHttps,
    })

    expect(response.headers.getSetCookie()).toEqual([
      clearedSecureSessionCookie,
    ])
  })

  it('succeeds without a session cookie too', async () => {
    const response = await logout()

    expect(response.status).toBe(200)
    expect(response.headers.getSetCookie()).toEqual([clearedSessionCookie])
  })
})

describe('GET /api/customers/me', () => {
  it('retrieves the customer with the session cookie as the bearer token', async () => {
    const response = await get('/api/customers/me', 'medusa_jwt=login-token')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ customer })
    expect(medusa.store.customer.retrieve).toHaveBeenCalledWith(
      {},
      { Authorization: 'Bearer login-token' },
    )
    expect(response.headers.getSetCookie()).toEqual([])
  })

  it('answers no customer when Medusa rejects the token, without reporting it', async () => {
    medusa.store.customer.retrieve.mockRejectedValue(
      medusaError(401, 'Unauthorized'),
    )

    const response = await get('/api/customers/me', 'medusa_jwt=expired')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ customer: null })
    expect(response.headers.getSetCookie()).toEqual([])
    expect(sentryEvents()).toBe(0)
    expect(sentryBreadcrumbs()).toBe(0)
  })

  it.each([
    ['without a session cookie', undefined],
    ['with an empty session cookie', 'medusa_jwt='],
    ['with only other cookies', 'cart_id=cart_123'],
  ])('answers no customer %s, without asking Medusa', async (_case, cookie) => {
    const response = await get('/api/customers/me', cookie)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ customer: null })
    expect(serverMedusaClient).not.toHaveBeenCalled()
    expect(medusa.store.customer.retrieve).not.toHaveBeenCalled()
    expect(response.headers.getSetCookie()).toEqual([])
    expect(sentryEvents()).toBe(0)
    expect(sentryBreadcrumbs()).toBe(0)
  })

  it('passes any other Medusa failure on and reports it once', async () => {
    medusa.store.customer.retrieve.mockRejectedValue(
      medusaError(503, 'Service Unavailable'),
    )

    const response = await get('/api/customers/me', 'medusa_jwt=login-token')

    expect(response.status).toBe(503)
    expect(failure()?.message).toBe('Service Unavailable')
    expect(sentryEvents()).toBe(1)
  })
})

describe('POST /api/customers/me', () => {
  it.each([
    ['without a session cookie', undefined],
    ['with an empty session cookie', 'medusa_jwt='],
  ])(
    'answers 401 %s, before reading the body or calling Medusa',
    async (_case, cookie) => {
      const response = await post(
        '/api/customers/me',
        { first_name: 'A' },
        cookie,
      )

      expect(response.status).toBe(401)
      expect(failure()?.message).toBe('Unauthorized')
      expect(serverMedusaClient).not.toHaveBeenCalled()
      expect(medusa.store.customer.update).not.toHaveBeenCalled()
      expect(sentryEvents()).toBe(0)
    },
  )

  it('updates the customer with the session cookie as the bearer token, forwarding only the allowed fields', async () => {
    const response = await post(
      '/api/customers/me',
      { first_name: 'Ada', phone: '123', email: 'eve@example.com' },
      'medusa_jwt=login-token',
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ customer })
    expect(medusa.store.customer.update).toHaveBeenCalledWith(
      { first_name: 'Ada', phone: '123' },
      {},
      { Authorization: 'Bearer login-token' },
    )
    expect(response.headers.getSetCookie()).toEqual([])
  })

  it('answers 400 for an invalid body, without calling Medusa', async () => {
    const response = await post(
      '/api/customers/me',
      { first_name: 'A' },
      'medusa_jwt=login-token',
    )

    expect(response.status).toBe(400)
    expect(failure()?.message).toBe('Invalid request body')
    await expect(response.json()).resolves.toMatchObject({
      data: { fieldErrors: { first_name: [expect.any(String)] } },
    })
    expect(medusa.store.customer.update).not.toHaveBeenCalled()
  })

  it('keeps the status of a Medusa error (an expired token stays a 401)', async () => {
    medusa.store.customer.update.mockRejectedValue(
      medusaError(401, 'Unauthorized'),
    )

    const response = await post(
      '/api/customers/me',
      { first_name: 'Ada' },
      'medusa_jwt=expired',
    )

    expect(response.status).toBe(401)
    expect(sentryEvents()).toBe(0)
    expect(sentryBreadcrumbs()).toBe(1)
  })
})
