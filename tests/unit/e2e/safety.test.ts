import { describe, expect, it } from 'vitest'
import {
  assertSafeE2eEnvironment,
  findUnsafeE2eEnvironment,
} from '~~/tests/e2e/support/safety'

describe('findUnsafeE2eEnvironment', () => {
  it('accepts a local, test-mode environment', () => {
    expect(
      findUnsafeE2eEnvironment({
        NUXT_PUBLIC_MEDUSA_BACKEND_URL: 'http://127.0.0.1:9000',
        NUXT_PUBLIC_PAYLOAD_URL: 'http://127.0.0.1:4010',
        NUXT_PUBLIC_STRIPE_KEY: 'pk_test_123',
        NUXT_PUBLIC_SENTRY_DSN: '',
      }),
    ).toEqual([])
  })

  it('refuses a live Stripe key', () => {
    const problems = findUnsafeE2eEnvironment({
      NUXT_PUBLIC_STRIPE_KEY: 'pk_live_123',
    })

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('pk_live_')
  })

  it.each(['sk_test_secret123', 'rk_test_secret123', 'sk_live_secret123'])(
    'refuses %s-like keys that are not publishable test keys, without repeating them',
    (key) => {
      const problems = findUnsafeE2eEnvironment({
        NUXT_PUBLIC_STRIPE_KEY: key,
      })

      expect(problems).toHaveLength(1)
      expect(problems[0]).toContain('pk_test_')
      expect(problems[0]).not.toContain('secret123')
    },
  )

  it('accepts no Stripe key at all', () => {
    expect(findUnsafeE2eEnvironment({ NUXT_PUBLIC_STRIPE_KEY: '' })).toEqual([])
  })

  it.each([
    [
      'NUXT_PUBLIC_MEDUSA_BACKEND_URL',
      'https://medusademo-production.up.railway.app',
    ],
    ['MEDUSA_URL', 'https://MedusaDemo-Production.example.com'],
    ['NUXT_PUBLIC_PAYLOAD_URL', 'https://payload-cms-production.example.com'],
  ])('refuses a production host in %s', (name, value) => {
    const problems = findUnsafeE2eEnvironment({ [name]: value })

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain(name)
  })

  it('refuses a Sentry DSN in the e2e build', () => {
    const problems = findUnsafeE2eEnvironment({
      NUXT_PUBLIC_SENTRY_DSN: 'https://key@o1.ingest.sentry.io/2',
    })

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('NUXT_PUBLIC_SENTRY_DSN')
  })

  it.each(['NUXT_PUBLIC_SENTRY_DSN', 'SENTRY_DSN', 'SENTRY_AUTH_TOKEN'])(
    'refuses %s set in the shell that starts the run',
    (name) => {
      const problems = findUnsafeE2eEnvironment({}, { [name]: 'something' })

      expect(problems).toHaveLength(1)
      expect(problems[0]).toContain(name)
    },
  )

  it('lists every problem at once', () => {
    expect(
      findUnsafeE2eEnvironment({
        NUXT_PUBLIC_STRIPE_KEY: 'pk_live_123',
        NUXT_PUBLIC_MEDUSA_BACKEND_URL: 'https://medusademo-production.x.app',
      }),
    ).toHaveLength(2)
  })
})

describe('assertSafeE2eEnvironment', () => {
  it('throws with every reason', () => {
    expect(() =>
      assertSafeE2eEnvironment({ NUXT_PUBLIC_STRIPE_KEY: 'pk_live_1' }),
    ).toThrow(/Refusing to start the e2e suite[\s\S]*pk_live_/)
  })

  it('does nothing for a safe environment', () => {
    expect(() => assertSafeE2eEnvironment({})).not.toThrow()
  })
})
