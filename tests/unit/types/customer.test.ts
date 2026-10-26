import { describe, expect, it } from '@jest/globals'

import { buildRegisterSchema, buildSigninSchema } from '~/types/customer'

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
