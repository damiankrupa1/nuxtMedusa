// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Medusa, { FetchError } from '@medusajs/js-sdk'

import * as Sentry from '@sentry/nuxt'
import { customerRepository } from '~~/server/repository/customer.repository'

const clientFetch = vi.fn()
const sdkLogin = vi.fn()
const sdkRegister = vi.fn()
const retrieve = vi.fn()
const create = vi.fn()
const update = vi.fn()

// Only the calls the repository makes; the cast stands in for the rest of
// the SDK client. auth.login()/auth.register() are there to show they are
// never used (#82).
const medusa = {
  client: { fetch: clientFetch },
  auth: { login: sdkLogin, register: sdkRegister },
  store: { customer: { retrieve, create, update } },
} as unknown as Medusa

const customers = () => customerRepository(medusa)
const customer = { id: 'cus_test' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(Sentry.isEnabled).mockReturnValue(true)
  clientFetch.mockImplementation(async (path: string) => ({
    token: path.endsWith('/register') ? 'register-token' : 'login-token',
  }))
  retrieve.mockResolvedValue({ customer })
  create.mockResolvedValue({ customer })
  update.mockResolvedValue({ customer })
})

describe('customerRepository', () => {
  describe('login', () => {
    it("asks Medusa's token route of the customer actor with email and password and returns the token", async () => {
      await expect(
        customers().login({ email: 'ada@example.com', password: 'secret' }),
      ).resolves.toBe('login-token')
      expect(clientFetch).toHaveBeenCalledTimes(1)
      expect(clientFetch).toHaveBeenCalledWith('/auth/customer/emailpass', {
        method: 'POST',
        body: { email: 'ada@example.com', password: 'secret' },
      })
      // The SDK's login would open a Medusa cookie session as well (#82)
      expect(sdkLogin).not.toHaveBeenCalled()
    })

    it('forwards nothing but the email and the password', async () => {
      // Not a literal, so the extra key type-checks as it would at runtime
      const body = {
        email: 'ada@example.com',
        password: 'secret',
        actor_type: 'user',
      }

      await customers().login(body)

      expect(clientFetch).toHaveBeenCalledWith('/auth/customer/emailpass', {
        method: 'POST',
        body: { email: 'ada@example.com', password: 'secret' },
      })
    })

    it.each([
      ['a third-party redirect', { location: 'https://idp.example' }],
      [
        'an MFA challenge',
        { token: 'partial', mfa_challenge: { id: 'mfa_1' } },
      ],
      [
        'a verification step',
        { token: 'partial', verification_required: true },
      ],
      ['an answer without a token', {}],
      ['an empty token', { token: '' }],
      ['no JSON object', 'login-token'],
    ])('rejects %s as an unexpected answer', async (_case, answer) => {
      clientFetch.mockResolvedValue(answer)

      await expect(
        customers().login({ email: 'ada@example.com', password: 'secret' }),
      ).rejects.toThrow('Unexpected login response from Medusa')
    })
  })

  describe('register', () => {
    it('registers the customer identity with email and password only and returns its token', async () => {
      const body = {
        email: 'ada@example.com',
        password: 'secret1',
        first_name: 'Ada',
      }

      await expect(customers().register(body)).resolves.toBe('register-token')
      expect(clientFetch).toHaveBeenCalledTimes(1)
      expect(clientFetch).toHaveBeenCalledWith(
        '/auth/customer/emailpass/register',
        {
          method: 'POST',
          body: { email: 'ada@example.com', password: 'secret1' },
        },
      )
      expect(sdkRegister).not.toHaveBeenCalled()
    })

    it('rejects an answer without a token', async () => {
      clientFetch.mockResolvedValue({})

      await expect(
        customers().register({ email: 'ada@example.com', password: 'secret1' }),
      ).rejects.toThrow('Unexpected registration response from Medusa')
    })
  })

  describe('calls made as the customer', () => {
    it('creates the customer with the profile fields and the given token, never the password', async () => {
      // The handler passes its whole parsed body, password included
      const body = {
        email: 'ada@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
        phone: '123',
        password: 'secret1',
      }

      await expect(
        customers().createCustomer('register-token', body),
      ).resolves.toEqual({ customer })
      expect(create).toHaveBeenCalledWith(
        {
          email: 'ada@example.com',
          first_name: 'Ada',
          last_name: 'Lovelace',
          phone: '123',
        },
        {},
        { Authorization: 'Bearer register-token' },
      )
    })

    it('retrieves the customer with the given token', async () => {
      await expect(
        customers().retrieveCustomer('login-token'),
      ).resolves.toEqual({ customer })
      expect(retrieve).toHaveBeenCalledWith(
        {},
        { Authorization: 'Bearer login-token' },
      )
    })

    it('updates the customer with the given data and token', async () => {
      await expect(
        customers().updateCustomer('login-token', { first_name: 'Ada' }),
      ).resolves.toEqual({ customer })
      expect(update).toHaveBeenCalledWith(
        { first_name: 'Ada' },
        {},
        { Authorization: 'Bearer login-token' },
      )
    })

    it('uses the token of each call, never one from an earlier call', async () => {
      const repository = customers()

      await repository.retrieveCustomer('first-token')
      await repository.updateCustomer('second-token', { last_name: 'L' })

      expect(retrieve).toHaveBeenLastCalledWith(
        {},
        { Authorization: 'Bearer first-token' },
      )
      expect(update).toHaveBeenLastCalledWith(
        { last_name: 'L' },
        {},
        { Authorization: 'Bearer second-token' },
      )
    })
  })

  describe('Medusa errors', () => {
    it.each([
      ['login', () => customers().login({ email: 'a@b.co', password: 'x' })],
      [
        'register',
        () => customers().register({ email: 'a@b.co', password: 'x' }),
      ],
      [
        'createCustomer',
        () =>
          customers().createCustomer('t', {
            email: 'a@b.co',
            first_name: 'Ada',
            last_name: 'Lovelace',
          }),
      ],
      ['retrieveCustomer', () => customers().retrieveCustomer('t')],
      ['updateCustomer', () => customers().updateCustomer('t', {})],
    ])(
      '%s passes the error on unchanged and does not report it (the handler wrapper does)',
      async (_name, call) => {
        const failure = new FetchError('Unauthorized', 'Unauthorized', 401)
        ;[clientFetch, retrieve, create, update].forEach((method) =>
          method.mockRejectedValue(failure),
        )

        await expect(call()).rejects.toBe(failure)
        expect(Sentry.captureException).not.toHaveBeenCalled()
        expect(Sentry.addBreadcrumb).not.toHaveBeenCalled()
      },
    )
  })
})

// #82, against the installed js-sdk: the client the server really gets.
// serverMedusaClient() builds it from the @nuxtjs/medusa 1.2.0 defaults, whose
// `auth` is below (shared with the browser client). Only the network is fake.
describe('customerRepository with the real SDK client', () => {
  const moduleAuthDefaults = {
    type: 'session',
    jwtTokenStorageKey: 'medusa_auth_token',
    jwtTokenStorageMethod: 'local',
  } as const
  const network = vi.fn<(input: URL, init: RequestInit) => Promise<Response>>()
  const sdkClient = () =>
    new Medusa({
      baseUrl: 'http://medusa.test',
      publishableKey: 'pk_test',
      auth: moduleAuthDefaults,
    })
  const requests = () =>
    network.mock.calls.map(
      ([input, init]) => `${init.method} ${new URL(input).pathname}`,
    )

  beforeEach(() => {
    network.mockImplementation(async () => Response.json({ token: 'jwt' }))
    vi.stubGlobal('fetch', network)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('signs in with the token request alone, opening no Medusa session', async () => {
    await expect(
      customerRepository(sdkClient()).login({
        email: 'ada@example.com',
        password: 'secret',
      }),
    ).resolves.toBe('jwt')

    expect(requests()).toEqual(['POST /auth/customer/emailpass'])
    expect(JSON.parse(String(network.mock.calls[0]?.[1].body))).toEqual({
      email: 'ada@example.com',
      password: 'secret',
    })
  })

  it('registers with the token request alone and stores nothing on the client', async () => {
    // auth.register() would also store the token in localStorage without
    // awaiting it, an unhandled rejection on the server that Vitest reports
    await expect(
      customerRepository(sdkClient()).register({
        email: 'ada@example.com',
        password: 'secret1',
      }),
    ).resolves.toBe('jwt')

    expect(requests()).toEqual(['POST /auth/customer/emailpass/register'])
  })

  it("is needed: the SDK's own login with these defaults also opens a Medusa session", async () => {
    // If this starts failing after an SDK or module upgrade, the workaround
    // in the repository may no longer be needed
    await sdkClient().auth.login('customer', 'emailpass', {
      email: 'ada@example.com',
      password: 'secret',
    })

    expect(requests()).toEqual([
      'POST /auth/customer/emailpass',
      'POST /auth/session',
    ])
  })
})
