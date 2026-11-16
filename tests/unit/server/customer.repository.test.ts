// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Medusa from '@medusajs/js-sdk'
import { FetchError } from '@medusajs/js-sdk'

import * as Sentry from '@sentry/nuxt'
import { customerRepository } from '~~/server/repository/customer.repository'

const login = vi.fn()
const register = vi.fn()
const retrieve = vi.fn()
const create = vi.fn()
const update = vi.fn()

// Only the calls the repository makes; the cast stands in for the rest of
// the SDK client
const medusa = {
  auth: { login, register },
  store: { customer: { retrieve, create, update } },
} as unknown as Medusa

const customers = () => customerRepository(medusa)
const customer = { id: 'cus_test' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(Sentry.isEnabled).mockReturnValue(true)
  login.mockResolvedValue('login-token')
  register.mockResolvedValue('register-token')
  retrieve.mockResolvedValue({ customer })
  create.mockResolvedValue({ customer })
  update.mockResolvedValue({ customer })
})

describe('customerRepository', () => {
  describe('login', () => {
    it('signs in the customer actor with email and password and returns the token', async () => {
      await expect(
        customers().login({ email: 'ada@example.com', password: 'secret' }),
      ).resolves.toBe('login-token')
      expect(login).toHaveBeenCalledWith('customer', 'emailpass', {
        email: 'ada@example.com',
        password: 'secret',
      })
    })

    it('forwards nothing but the email and the password', async () => {
      // Not a literal, so the extra key type-checks as it would at runtime
      const body = {
        email: 'ada@example.com',
        password: 'secret',
        actor_type: 'user',
      }

      await customers().login(body)

      expect(login).toHaveBeenCalledWith('customer', 'emailpass', {
        email: 'ada@example.com',
        password: 'secret',
      })
    })

    it.each([
      ['a third-party redirect', { location: 'https://idp.example' }],
      ['an MFA challenge', { mfa_required: true, token: 'partial' }],
    ])('rejects %s as an unexpected answer', async (_case, answer) => {
      login.mockResolvedValue(answer)

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
      expect(register).toHaveBeenCalledWith('customer', 'emailpass', {
        email: 'ada@example.com',
        password: 'secret1',
      })
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

    it('still asks Medusa without a token, as GET /api/customers/me always has', async () => {
      await customers().retrieveCustomer(undefined)

      expect(retrieve).toHaveBeenCalledWith(
        {},
        { Authorization: 'Bearer undefined' },
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
        ;[login, register, retrieve, create, update].forEach((method) =>
          method.mockRejectedValue(failure),
        )

        await expect(call()).rejects.toBe(failure)
        expect(Sentry.captureException).not.toHaveBeenCalled()
        expect(Sentry.addBreadcrumb).not.toHaveBeenCalled()
      },
    )
  })
})
