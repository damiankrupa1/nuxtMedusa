import { describe, expect, it } from '@jest/globals'

import { buildNewsletterSchema } from '~/types/newsletter'

describe('newsletter schema', () => {
  const schema = buildNewsletterSchema((key) => key)

  it('accepts a valid email with consent', () => {
    const result = schema.safeParse({ email: 'jan@example.com', consent: true })

    expect(result.success).toBe(true)
  })

  it('rejects an email that only contains an @', () => {
    const result = schema.safeParse({ email: 'a@', consent: true })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('app.newsletter.errorEmail')
  })

  it('rejects a signup without consent', () => {
    const result = schema.safeParse({
      email: 'jan@example.com',
      consent: false,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('app.newsletter.errorConsent')
  })
})
