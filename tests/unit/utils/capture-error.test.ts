import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals'
import * as Sentry from '@sentry/nuxt'

import { captureError } from '~/utils/capture-error'

// @sentry/nuxt is mocked for every test in tests/setup.ts

describe('captureError', () => {
  const originalEnv = process.env.NODE_ENV
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(Sentry.isEnabled).mockReturnValue(true)
  })

  afterEach(() => {
    Object.assign(process.env, { NODE_ENV: originalEnv })
  })

  describe('without a Sentry DSN', () => {
    beforeEach(() => {
      jest.mocked(Sentry.isEnabled).mockReturnValue(false)
    })

    it('only logs to the console', () => {
      const error = new Error('boom')

      captureError(error, { source: 'medusa' })

      expect(consoleError).toHaveBeenCalledWith(error, { source: 'medusa' })
      expect(Sentry.captureException).not.toHaveBeenCalled()
      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled()
    })
  })

  describe('with Sentry enabled', () => {
    it('sends the error with the context mapped to tags', () => {
      const error = new Error('Payment failed')

      captureError(error, {
        source: 'stripe',
        type: 'api_error',
        code: 'processing_error',
        declineCode: 'generic_decline',
      })

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: {
          source: 'stripe',
          error_type: 'api_error',
          error_code: 'processing_error',
          decline_code: 'generic_decline',
        },
        extra: {},
      })
    })

    it('tags a Payload failure with its global', () => {
      const error = new Error('502')

      captureError(error, { source: 'payload', global: 'navigation' })

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: { source: 'payload', cms_global: 'navigation' },
        extra: {},
      })
    })

    it('keeps unknown context keys as extra data', () => {
      const error = new Error('boom')

      captureError(error, { source: 'inpost', step: 'widget' })

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: { source: 'inpost' },
        extra: { step: 'widget' },
      })
    })

    it.each([
      ['a Medusa 404', { status: 404 }, { source: 'medusa' }],
      ['a Medusa validation error', { status: 400 }, { source: 'medusa' }],
      ['an h3 401', { statusCode: 401 }, { source: 'server-api' }],
      [
        'a card decline',
        new Error('Your card was declined.'),
        { source: 'stripe', type: 'card_error', code: 'card_declined' },
      ],
    ])('does not send %s as an event', (_name, cause, context) => {
      const error = Object.assign(new Error('expected'), cause)

      captureError(error, context)

      expect(Sentry.captureException).not.toHaveBeenCalled()
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'expected-error',
          level: 'info',
          message: 'expected',
        }),
      )
    })

    it.each([
      ['a Medusa 500', { status: 500 }],
      ['a Medusa 429', { status: 429 }],
      ['an error without a status', {}],
    ])('still sends %s', (_name, cause) => {
      const error = Object.assign(new Error('unexpected'), cause)

      captureError(error, { source: 'medusa' })

      expect(Sentry.captureException).toHaveBeenCalledTimes(1)
    })

    it('logs to the console in development only', () => {
      captureError(new Error('dev'))
      expect(consoleError).toHaveBeenCalledTimes(1)

      consoleError.mockClear()
      Object.assign(process.env, { NODE_ENV: 'production' })
      captureError(new Error('prod'))
      expect(consoleError).not.toHaveBeenCalled()
    })
  })
})
