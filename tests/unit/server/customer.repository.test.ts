// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Medusa, { FetchError } from '@medusajs/js-sdk'

import * as Sentry from '@sentry/nuxt'
import { buildBrowserMedusaConfig } from '~/utils/medusa'
import { customerRepository } from '~~/server/repository/customer.repository'
import { buildServerMedusaConfig } from '~~/server/utils/medusa'
import { medusaCustomerResponse } from '~~/tests/fixtures/medusa'

const clientFetch = vi.fn()
const sdkLogin = vi.fn()
const sdkRegister = vi.fn()
const sdkRefresh = vi.fn()
const retrieve = vi.fn()
const create = vi.fn()
const update = vi.fn()

// Only the calls the repository makes; the cast stands in for the rest of
// the SDK client. `client.fetch` is there to show no auth request is made
// by hand any more (#89).
const medusa = {
  client: { fetch: clientFetch },
  auth: { login: sdkLogin, register: sdkRegister, refresh: sdkRefresh },
  store: { customer: { retrieve, create, update } },
} as unknown as Medusa

const customers = () => customerRepository(medusa)
// Medusa's recorded answer: the repository checks it (#84)
const { customer } = medusaCustomerResponse

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(Sentry.isEnabled).mockReturnValue(true)
  sdkLogin.mockResolvedValue('login-token')
  sdkRegister.mockResolvedValue('register-token')
  sdkRefresh.mockResolvedValue({ token: 'session-token' })
  retrieve.mockResolvedValue({ customer })
  create.mockResolvedValue({ customer })
  update.mockResolvedValue({ customer })
})

describe('customerRepository', () => {
  describe('login', () => {
    it("signs in through the SDK's login for the customer actor and returns the token", async () => {
      await expect(
        customers().login({ email: 'ada@example.com', password: 'secret' }),
      ).resolves.toBe('login-token')
      expect(sdkLogin).toHaveBeenCalledTimes(1)
      expect(sdkLogin).toHaveBeenCalledWith('customer', 'emailpass', {
        email: 'ada@example.com',
        password: 'secret',
      })
      expect(clientFetch).not.toHaveBeenCalled()
    })

    it('forwards nothing but the email and the password', async () => {
      // Not a literal, so the extra key type-checks as it would at runtime
      const body = {
        email: 'ada@example.com',
        password: 'secret',
        actor_type: 'user',
      }

      await customers().login(body)

      expect(sdkLogin).toHaveBeenCalledWith('customer', 'emailpass', {
        email: 'ada@example.com',
        password: 'secret',
      })
    })

    // What the SDK's login returns instead of a token
    it.each([
      ['a third-party redirect', { location: 'https://idp.example' }],
      [
        'an MFA challenge',
        {
          mfa_required: true,
          mfa_challenge: { id: 'mfa_1' },
          token: 'partial',
        },
      ],
      [
        'a verification step',
        { verification_required: true, verification: {}, token: 'partial' },
      ],
    ])('rejects %s as an unexpected answer', async (_case, answer) => {
      sdkLogin.mockResolvedValue(answer)

      await expect(
        customers().login({ email: 'ada@example.com', password: 'secret' }),
      ).rejects.toThrow('Unexpected login response from Medusa')
    })
  })

  describe('register', () => {
    it('registers the customer identity through the SDK with email and password only and returns its token', async () => {
      const body = {
        email: 'ada@example.com',
        password: 'secret1',
        first_name: 'Ada',
      }

      await expect(customers().register(body)).resolves.toBe('register-token')
      expect(sdkRegister).toHaveBeenCalledTimes(1)
      expect(sdkRegister).toHaveBeenCalledWith('customer', 'emailpass', {
        email: 'ada@example.com',
        password: 'secret1',
      })
      expect(clientFetch).not.toHaveBeenCalled()
    })

    // The SDK throws on an answer without a token itself; this is what an
    // SDK or Medusa change that let one through would hand the repository
    it.each([
      ['an empty token', ''],
      ['no string', { token: 'register-token' }],
    ])('rejects %s as an unexpected answer (#84)', async (_case, answer) => {
      sdkRegister.mockResolvedValue(answer)

      await expect(
        customers().register({ email: 'ada@example.com', password: 'secret1' }),
      ).rejects.toThrow('Unexpected registration response from Medusa')
    })
  })

  describe('refreshToken', () => {
    it("exchanges the registration token for the customer's session token", async () => {
      await expect(customers().refreshToken('register-token')).resolves.toBe(
        'session-token',
      )
      expect(sdkRefresh).toHaveBeenCalledTimes(1)
      expect(sdkRefresh).toHaveBeenCalledWith({
        Authorization: 'Bearer register-token',
      })
      expect(clientFetch).not.toHaveBeenCalled()
    })

    it.each([
      ['without a token', {}],
      ['with an empty token', { token: '' }],
      ['with an MFA challenge', { mfa_challenge: { id: 'mfa_1' } }],
      ['with a verification step', { verification_required: true }],
      // What the SDK's type says these answers carry: a token without an
      // actor, which must not become the session (#84)
      [
        'with an MFA challenge and its token',
        { token: 'partial', mfa_required: true, mfa_challenge: { id: 'm' } },
      ],
      [
        'with a verification step and its token',
        { token: 'partial', verification_required: true, verification: {} },
      ],
    ])('rejects an answer %s', async (_case, body) => {
      sdkRefresh.mockResolvedValue(body)

      await expect(customers().refreshToken('register-token')).rejects.toThrow(
        'Unexpected token refresh response from Medusa',
      )
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

    // #84: the customer the account page and the session rely on
    it.each([
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
      '%s rejects an answer without the customer id and reports nothing (the handler wrapper does)',
      async (_name, call) => {
        const { id: _id, ...withoutId } = customer
        ;[retrieve, create, update].forEach((method) =>
          method.mockResolvedValue({ customer: withoutId }),
        )

        await expect(call()).rejects.toThrow(
          'Unexpected customer response from Medusa',
        )
        expect(Sentry.captureException).not.toHaveBeenCalled()
      },
    )
  })

  describe('Medusa errors', () => {
    it.each([
      ['login', () => customers().login({ email: 'a@b.co', password: 'x' })],
      [
        'register',
        () => customers().register({ email: 'a@b.co', password: 'x' }),
      ],
      ['refreshToken', () => customers().refreshToken('t')],
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
        ;[sdkLogin, sdkRegister, sdkRefresh, retrieve, create, update].forEach(
          (method) => method.mockRejectedValue(failure),
        )

        await expect(call()).rejects.toBe(failure)
        expect(Sentry.captureException).not.toHaveBeenCalled()
        expect(Sentry.addBreadcrumb).not.toHaveBeenCalled()
      },
    )
  })
})

// #82, against the installed js-sdk with the client the server really gets:
// the config of serverMedusaClient() (server/utils/medusa.ts). Only the
// network is fake. Vitest also fails on an unhandled rejection inside the SDK.
describe('customerRepository with the real SDK client', () => {
  const network = vi.fn<(input: URL, init: RequestInit) => Promise<Response>>()
  const connection = {
    backendUrl: 'http://medusa.test',
    publishableKey: 'pk_test',
  }
  const serverClient = () => new Medusa(buildServerMedusaConfig(connection))
  const requests = () =>
    network.mock.calls.map(
      ([input, init]) => `${init.method ?? 'GET'} ${new URL(input).pathname}`,
    )
  const answer = (body: unknown) =>
    network.mockImplementation(async () => Response.json(body))
  const signin = { email: 'ada@example.com', password: 'secret' }

  beforeEach(() => {
    answer({ token: 'jwt' })
    vi.stubGlobal('fetch', network)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('signs in with the token request alone, opening no Medusa session', async () => {
    await expect(
      customerRepository(serverClient()).login(signin),
    ).resolves.toBe('jwt')

    expect(requests()).toEqual(['POST /auth/customer/emailpass'])
    expect(JSON.parse(String(network.mock.calls[0]?.[1].body))).toEqual(signin)
  })

  it('registers with the token request alone, without an unhandled rejection', async () => {
    // With 'local' token storage auth.register() stored the token in
    // localStorage without awaiting it: a rejection on the server
    await expect(
      customerRepository(serverClient()).register({
        email: 'ada@example.com',
        password: 'secret1',
      }),
    ).resolves.toBe('jwt')

    expect(requests()).toEqual(['POST /auth/customer/emailpass/register'])
  })

  it('refreshes the token with that request alone, sending the given token', async () => {
    await expect(
      customerRepository(serverClient()).refreshToken('register-token'),
    ).resolves.toBe('jwt')

    expect(requests()).toEqual(['POST /auth/token/refresh'])
    expect(
      new Headers(network.mock.calls[0]?.[1].headers).get('authorization'),
    ).toBe('Bearer register-token')
  })

  it.each([
    ['a third-party redirect', { location: 'https://idp.example' }],
    ['an MFA challenge', { token: 'partial', mfa_challenge: { id: 'mfa_1' } }],
    ['a verification step', { token: 'partial', verification_required: true }],
  ])('rejects a login answered with %s', async (_case, body) => {
    answer(body)

    await expect(
      customerRepository(serverClient()).login(signin),
    ).rejects.toThrow('Unexpected login response from Medusa')
    expect(requests()).toEqual(['POST /auth/customer/emailpass'])
  })

  // The SDK throws on these itself, with its own message
  it.each([
    ['without a token', {}],
    ['with an empty token', { token: '' }],
    ['with no JSON object', 'jwt'],
  ])('rejects a login or a registration answered %s', async (_case, body) => {
    answer(body)
    const repository = customerRepository(serverClient())

    await expect(repository.login(signin)).rejects.toThrow(
      'Unexpected authentication response',
    )
    await expect(repository.register(signin)).rejects.toThrow(
      'Unexpected registration response',
    )
  })

  it("passes Medusa's error on unchanged", async () => {
    network.mockImplementation(async () =>
      Response.json(
        { message: 'Invalid email or password' },
        { status: 401, statusText: 'Unauthorized' },
      ),
    )

    await expect(
      customerRepository(serverClient()).login(signin),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password',
    })
  })

  it('retrieves the customer with the given token and keeps none from the login', async () => {
    const repository = customerRepository(serverClient())
    await repository.login(signin)
    answer({ customer })

    await repository.retrieveCustomer('customer-token')

    expect(requests()).toEqual([
      'POST /auth/customer/emailpass',
      'GET /store/customers/me',
    ])
    const headers = new Headers(network.mock.calls[1]?.[1].headers)
    expect(headers.get('authorization')).toBe('Bearer customer-token')
    expect(headers.get('x-publishable-api-key')).toBe('pk_test')
  })

  it("is why the server has its own config: the SDK's login with the page client's config opens a Medusa session", async () => {
    await new Medusa(buildBrowserMedusaConfig(connection)).auth.login(
      'customer',
      'emailpass',
      signin,
    )

    expect(requests()).toEqual([
      'POST /auth/customer/emailpass',
      'POST /auth/session',
    ])
  })
})
