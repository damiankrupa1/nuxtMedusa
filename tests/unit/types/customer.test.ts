import { describe, expect, it } from '@jest/globals'

import {
  buildRegisterSchema,
  buildSigninSchema,
  registerRequestSchema,
  signinRequestSchema,
  updateCustomerRequestSchema,
} from '~/types/customer'

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
