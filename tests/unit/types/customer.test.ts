import { describe, expect, it } from 'vitest'
import type { z } from 'zod'

import {
  buildRegisterSchema,
  buildSigninSchema,
  medusaCustomerResponseSchema,
  medusaTokenRefreshSchema,
  medusaTokenSchema,
  registerRequestSchema,
  signinRequestSchema,
  updateCustomerRequestSchema,
} from '~/types/customer'
import { medusaCustomerResponse } from '~~/tests/fixtures/medusa'

const t = (key: string) => key

describe('signin schema', () => {
  const schema = buildSigninSchema(t)

  it('accepts a valid email and a password', () => {
    expect(
      schema.safeParse({ email: 'jan@example.com', password: 'x' }).success,
    ).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = schema.safeParse({ email: 'a@', password: 'x' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('validation.emailInvalid')
  })

  it('rejects an empty password', () => {
    const result = schema.safeParse({ email: 'jan@example.com', password: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('validation.passwordRequired')
  })
})

describe('register schema', () => {
  const schema = buildRegisterSchema(t)
  const valid = {
    first_name: 'Jan',
    last_name: 'Kowalski',
    email: 'jan@example.com',
    phone: '',
    password: 'secret1',
  }

  it('accepts a valid registration, with or without a phone', () => {
    expect(schema.safeParse(valid).success).toBe(true)
    expect(schema.safeParse({ ...valid, phone: undefined }).success).toBe(true)
  })

  it.each([
    ['first_name', 'J', 'validation.firstNameMin'],
    ['last_name', 'K', 'validation.lastNameMin'],
    ['email', 'a@', 'validation.emailInvalid'],
    ['password', '12345', 'validation.passwordMin'],
  ])('rejects an invalid %s', (field, value, message) => {
    const result = schema.safeParse({ ...valid, [field]: value })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(message)
  })
})

// The same schemas, built without `t`, validate server/api/customers/**
describe('customer request schemas', () => {
  it('answer with zod messages instead of i18n keys', () => {
    const result = signinRequestSchema.safeParse({ email: 'a@', password: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Invalid email address',
      'Too small: expected string to have >=1 characters',
    ])
  })

  it('apply the registration form rules', () => {
    const result = registerRequestSchema.safeParse({
      first_name: 'Jan',
      last_name: 'Kowalski',
      email: 'jan@example.com',
      password: '12345',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['password'])
  })

  it('reject a body that is not an object', () => {
    expect(signinRequestSchema.safeParse(undefined).success).toBe(false)
  })

  it('do not forward fields the form does not collect', () => {
    expect(
      signinRequestSchema.parse({
        email: 'jan@example.com',
        password: 'x',
        actor_type: 'user',
      }),
    ).toEqual({ email: 'jan@example.com', password: 'x' })
  })
})

describe('update customer request schema', () => {
  it('accepts a partial profile update', () => {
    expect(updateCustomerRequestSchema.parse({ first_name: 'Janek' })).toEqual({
      first_name: 'Janek',
    })
  })

  it('drops fields Medusa does not let a customer change here', () => {
    expect(
      updateCustomerRequestSchema.parse({
        last_name: 'Nowak',
        email: 'other@example.com',
        password: 'secret1',
        metadata: { vip: true },
      }),
    ).toEqual({ last_name: 'Nowak' })
  })

  it('keeps the registration rules for the fields it accepts', () => {
    expect(
      updateCustomerRequestSchema.safeParse({ first_name: 'J' }).success,
    ).toBe(false)
  })
})

// The narrow schemas of Medusa's answers (#84): what the storefront reads,
// loose, so a field Medusa adds passes
const issuesOf = (result: { error?: z.ZodError }) =>
  result.error?.issues.map(({ path, code }) => [path.join('.'), code])

describe('medusaTokenSchema', () => {
  it('accepts the token string a login or registration answers', () => {
    expect(medusaTokenSchema.safeParse('eyJ.header.sig').success).toBe(true)
  })

  it.each([
    ['an empty token', ''],
    ['a redirect', { location: 'https://idp.example' }],
    ['an MFA challenge', { token: 'partial', mfa_required: true }],
    ['nothing', undefined],
  ])('refuses %s', (_case, answer) => {
    expect(medusaTokenSchema.safeParse(answer).success).toBe(false)
  })
})

describe('medusaTokenRefreshSchema', () => {
  it('accepts a token answer, with any field Medusa adds', () => {
    expect(
      medusaTokenRefreshSchema.safeParse({ token: 'jwt', expires_in: 3600 })
        .success,
    ).toBe(true)
  })

  it.each([
    ['without a token', {}, [['token', 'invalid_type']]],
    ['with an empty token', { token: '' }, [['token', 'too_small']]],
    [
      'with a token of the wrong type',
      { token: 1 },
      [['token', 'invalid_type']],
    ],
    [
      'for an MFA challenge, which carries a token without an actor',
      { token: 'partial', mfa_required: true, mfa_challenge: { id: 'mfa_1' } },
      [['mfa_required', 'invalid_type']],
    ],
    [
      'for a verification step',
      { token: 'partial', verification_required: true },
      [['verification_required', 'invalid_type']],
    ],
  ])('refuses an answer %s', (_case, answer, issues) => {
    expect(issuesOf(medusaTokenRefreshSchema.safeParse(answer))).toEqual(issues)
  })
})

describe('medusaCustomerResponseSchema', () => {
  it("accepts Medusa's recorded customer answer", () => {
    expect(
      medusaCustomerResponseSchema.safeParse(medusaCustomerResponse).success,
    ).toBe(true)
  })

  it('accepts fields Medusa adds, on the customer and around it', () => {
    const answer = {
      ...medusaCustomerResponse,
      added: true,
      customer: { ...medusaCustomerResponse.customer, loyalty_points: 3 },
    }

    expect(medusaCustomerResponseSchema.parse(answer)).toEqual(answer)
  })

  it('accepts a customer without a phone, as the SDK type allows', () => {
    const { phone: _phone, ...customer } = medusaCustomerResponse.customer

    expect(medusaCustomerResponseSchema.safeParse({ customer }).success).toBe(
      true,
    )
  })

  it.each(['id', 'email', 'first_name', 'last_name'] as const)(
    'refuses a customer without the %s the storefront reads',
    (field) => {
      const { [field]: _removed, ...customer } = medusaCustomerResponse.customer

      expect(
        issuesOf(medusaCustomerResponseSchema.safeParse({ customer })),
      ).toEqual([[`customer.${field}`, 'invalid_type']])
    },
  )

  it.each([
    ['an empty id', { id: '' }, 'customer.id', 'too_small'],
    ['an id of the wrong type', { id: 7 }, 'customer.id', 'invalid_type'],
    [
      'an e-mail of the wrong type',
      { email: null },
      'customer.email',
      'invalid_type',
    ],
    [
      'a phone of the wrong type',
      { phone: 600 },
      'customer.phone',
      'invalid_type',
    ],
  ])('refuses %s', (_case, change, path, code) => {
    const customer = { ...medusaCustomerResponse.customer, ...change }

    expect(
      issuesOf(medusaCustomerResponseSchema.safeParse({ customer })),
    ).toEqual([[path, code]])
  })

  it('refuses an answer without a customer', () => {
    expect(issuesOf(medusaCustomerResponseSchema.safeParse({}))).toEqual([
      ['customer', 'invalid_type'],
    ])
  })
})
