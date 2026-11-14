import { describe, expect, it } from 'vitest'

import {
  buildNewsletterSchema,
  createNewsletterForm,
  type NewsletterForm,
} from '~/types/newsletter'

const emptyForm: NewsletterForm = {
  email: '',
  interests: { women: false, men: false },
  consent: false,
}

describe('newsletter schema', () => {
  const schema = buildNewsletterSchema((key) => key)
  const signup = (overrides: Partial<NewsletterForm> = {}) => ({
    ...createNewsletterForm(),
    email: 'jan@example.com',
    consent: true,
    ...overrides,
  })

  it('accepts a valid signup and keeps the chosen interests', () => {
    const result = schema.safeParse(
      signup({ interests: { women: true, men: false } }),
    )

    expect(result.success).toBe(true)
    expect(result.data?.interests).toEqual({ women: true, men: false })
  })

  it('rejects an email that only contains an @', () => {
    const result = schema.safeParse(signup({ email: 'a@' }))

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('app.newsletter.errorEmail')
  })

  it('rejects a signup without consent', () => {
    const result = schema.safeParse(signup({ consent: false }))

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('app.newsletter.errorConsent')
  })
})

describe('createNewsletterForm', () => {
  it('starts with no email, no interests and no consent', () => {
    expect(createNewsletterForm()).toEqual(emptyForm)
  })

  it('returns a new object every time, so form instances never share state', () => {
    const first = createNewsletterForm()
    first.email = 'jan@example.com'
    first.interests.women = true

    expect(createNewsletterForm()).toEqual(emptyForm)
  })
})
