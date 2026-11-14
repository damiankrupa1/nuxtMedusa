import { describe, expect, it } from 'vitest'
import type { ErrorEvent } from '@sentry/nuxt'

import {
  buildSentryOptions,
  isExpectedError,
  scrubSentryEvent,
  scrubString,
  toSentryContext,
} from '~/utils/sentry'

const makeEvent = (event: Partial<ErrorEvent>): ErrorEvent => ({
  type: undefined,
  ...event,
})

describe('sentry utils', () => {
  describe('an invalid Payload response (zod issues)', () => {
    // What cms.repository.ts passes to captureError()
    const context = {
      source: 'payload',
      global: 'footer-content',
      type: 'invalid_response',
      issues: [
        {
          code: 'invalid_type',
          path: 'contact.phone',
          message: 'Invalid input: expected string, received number',
        },
      ],
    }
    const error = new Error('Payload global "footer-content" is invalid')

    it('is an alert, not an expected error', () => {
      expect(isExpectedError(error, context)).toBe(false)
    })

    it('becomes searchable tags plus the issues in extra', () => {
      expect(toSentryContext(context)).toEqual({
        tags: {
          source: 'payload',
          cms_global: 'footer-content',
          error_type: 'invalid_response',
        },
        extra: { issues: context.issues },
      })
    })

    it('keeps the issues readable through the privacy filter', () => {
      const event = scrubSentryEvent(
        makeEvent({ extra: toSentryContext(context).extra }),
      )

      expect(event.extra).toEqual({ issues: context.issues })
    })
  })

  describe('isExpectedError', () => {
    it('treats 4xx statuses on status, statusCode and response as expected', () => {
      expect(isExpectedError({ status: 404 })).toBe(true)
      expect(isExpectedError({ statusCode: 422 })).toBe(true)
      expect(isExpectedError({ response: { status: 401 } })).toBe(true)
    })

    it('does not treat server errors, timeouts or rate limits as expected', () => {
      expect(isExpectedError({ status: 500 })).toBe(false)
      expect(isExpectedError({ status: 502 })).toBe(false)
      expect(isExpectedError({ status: 408 })).toBe(false)
      expect(isExpectedError({ status: 429 })).toBe(false)
    })

    it('does not treat errors without a status as expected', () => {
      expect(isExpectedError(new Error('boom'))).toBe(false)
      expect(isExpectedError('boom')).toBe(false)
      expect(isExpectedError(null)).toBe(false)
    })

    it('treats Stripe customer errors as expected', () => {
      const error = new Error('declined')
      expect(
        isExpectedError(error, { source: 'stripe', type: 'card_error' }),
      ).toBe(true)
      expect(
        isExpectedError(error, { source: 'stripe', type: 'validation_error' }),
      ).toBe(true)
      expect(
        isExpectedError(error, { source: 'stripe', type: 'api_error' }),
      ).toBe(false)
    })

    it('does not mistake another source with a card_error type for a decline', () => {
      expect(
        isExpectedError(new Error('x'), {
          source: 'medusa',
          type: 'card_error',
        }),
      ).toBe(false)
    })
  })

  describe('toSentryContext', () => {
    it('maps known keys to tags and the rest to extra data', () => {
      expect(
        toSentryContext({
          source: 'payload',
          global: 'footer-content',
          code: 400,
          step: 'x',
          missing: undefined,
        }),
      ).toEqual({
        tags: {
          source: 'payload',
          cms_global: 'footer-content',
          error_code: '400',
        },
        extra: { step: 'x' },
      })
    })

    it('keeps a non-primitive known key as extra data instead of a tag', () => {
      expect(toSentryContext({ type: { a: 1 } })).toEqual({
        tags: {},
        extra: { type: { a: 1 } },
      })
    })
  })

  describe('scrubString', () => {
    it('masks e-mail addresses', () => {
      expect(
        scrubString('No customer jan.kowalski+shop@example.com found'),
      ).toBe('No customer [email] found')
    })

    it('masks bearer tokens and JWTs', () => {
      expect(scrubString('Authorization: Bearer abc.def-ghi')).toBe(
        'Authorization: Bearer [token]',
      )
      expect(
        scrubString('jwt eyJhbGciOi.eyJhY3Rvcl9pZCI6.c2lnbmF0dXJl end'),
      ).toBe('jwt [jwt] end')
    })

    it('masks Stripe client secrets', () => {
      expect(scrubString('pi_3Pabc123_secret_XyZ789')).toBe('[stripe_secret]')
    })

    it('masks Medusa cart, order and customer ids', () => {
      expect(
        scrubString('/store/carts/cart_01J5ABCDEFGHJKMNPQRSTVWXYZ/complete'),
      ).toBe('/store/carts/cart_[id]/complete')
      expect(scrubString('cus_01J5ABCDEFGHJKMNPQRSTVWXYZ')).toBe('cus_[id]')
    })

    it('leaves other text alone', () => {
      expect(scrubString('Failed to load navigation')).toBe(
        'Failed to load navigation',
      )
    })
  })

  describe('scrubSentryEvent', () => {
    it('drops the user, cookies, request body and query string', () => {
      const event = makeEvent({
        user: { id: '1', email: 'jan@example.com', ip_address: '1.2.3.4' },
        request: {
          method: 'POST',
          url: 'https://shop.example.com/pl/checkout?payment_intent_client_secret=pi_1_secret_2&q=jan@example.com',
          query_string: 'q=jan@example.com',
          cookies: { medusa_jwt: 'eyJabc.def.ghi', cart_id: 'cart_1' },
          data: { email: 'jan@example.com', password: 'hunter2' },
          headers: {},
        },
      })

      const scrubbed = scrubSentryEvent(event)

      expect(scrubbed.user).toBeUndefined()
      expect(scrubbed.request).toEqual({
        method: 'POST',
        url: 'https://shop.example.com/pl/checkout',
        headers: {},
      })
    })

    it('keeps only harmless request headers', () => {
      const scrubbed = scrubSentryEvent(
        makeEvent({
          request: {
            url: 'https://shop.example.com/',
            headers: {
              Authorization: 'Bearer secret',
              Cookie: 'medusa_jwt=eyJabc.def.ghi',
              'x-publishable-api-key': 'pk_123',
              'x-forwarded-for': '1.2.3.4',
              'User-Agent': 'jest',
              'accept-language': 'pl',
            },
          },
        }),
      )

      expect(scrubbed.request?.headers).toEqual({
        'User-Agent': 'jest',
        'accept-language': 'pl',
      })
    })

    it('masks secrets in the message and exception values', () => {
      const scrubbed = scrubSentryEvent(
        makeEvent({
          message: 'Customer jan@example.com not found',
          exception: {
            values: [
              {
                type: 'Error',
                value: 'Cart cart_01J5ABCDEFGHJKMNPQRSTVWXYZ failed',
              },
            ],
          },
        }),
      )

      expect(scrubbed.message).toBe('Customer [email] not found')
      expect(scrubbed.exception?.values?.[0]?.value).toBe(
        'Cart cart_[id] failed',
      )
    })

    it('filters sensitive keys in extra data and breadcrumbs, at any depth', () => {
      const scrubbed = scrubSentryEvent(
        makeEvent({
          extra: {
            step: 'delivery',
            email: 'jan@example.com',
            shipping_address: { city: 'Kraków', postal_code: '30-001' },
            nested: { list: [{ phone: '+48123456789', ok: 'fine' }] },
          },
          breadcrumbs: [
            {
              category: 'fetch',
              message: 'POST jan@example.com',
              data: {
                url: 'https://api.example.com/store/carts/cart_01J5ABCDEFGHJKMNPQRSTVWXYZ?fields=items',
                status_code: 200,
                customer_id: 'cus_1',
              },
            },
            {
              category: 'navigation',
              data: { from: '/pl/store?q=a@b.co', to: '/pl/cart#top' },
            },
          ],
        }),
      )

      expect(scrubbed.extra).toEqual({
        step: 'delivery',
        email: '[Filtered]',
        shipping_address: '[Filtered]',
        nested: { list: [{ phone: '[Filtered]', ok: 'fine' }] },
      })
      expect(scrubbed.breadcrumbs).toEqual([
        {
          category: 'fetch',
          message: 'POST [email]',
          data: {
            url: 'https://api.example.com/store/carts/cart_[id]',
            status_code: 200,
            customer_id: '[Filtered]',
          },
        },
        {
          category: 'navigation',
          data: { from: '/pl/store', to: '/pl/cart' },
        },
      ])
    })

    it('does not change the event it was given', () => {
      const event = makeEvent({
        user: { id: '1' },
        message: 'jan@example.com',
        extra: { email: 'jan@example.com' },
      })

      scrubSentryEvent(event)

      expect(event.user).toEqual({ id: '1' })
      expect(event.message).toBe('jan@example.com')
      expect(event.extra).toEqual({ email: 'jan@example.com' })
    })
  })

  describe('buildSentryOptions', () => {
    it('returns null without a DSN, so Sentry is not initialised', () => {
      expect(buildSentryOptions({})).toBeNull()
      expect(buildSentryOptions({ dsn: '' })).toBeNull()
      expect(buildSentryOptions({ dsn: '   ' })).toBeNull()
    })

    it('passes DSN, environment and release and never sends default PII', () => {
      expect(
        buildSentryOptions({
          dsn: 'https://key@o1.ingest.sentry.io/2',
          environment: 'preview',
          release: 'abc123',
        }),
      ).toEqual({
        dsn: 'https://key@o1.ingest.sentry.io/2',
        environment: 'preview',
        release: 'abc123',
        sendDefaultPii: false,
        tracesSampleRate: undefined,
        beforeSend: scrubSentryEvent,
      })
    })

    it('falls back to NODE_ENV for the environment and omits an empty release', () => {
      const options = buildSentryOptions({
        dsn: 'https://key@o1.ingest.sentry.io/2',
        release: '',
      })

      expect(options?.environment).toBe(process.env.NODE_ENV)
      expect(options?.release).toBeUndefined()
    })

    it.each([
      ['0.1', 0.1],
      [0.5, 0.5],
      ['1', 1],
      ['0', undefined],
      ['', undefined],
      ['abc', undefined],
      ['2', undefined],
      ['-1', undefined],
      [undefined, undefined],
    ])('reads the trace sample rate %p as %p', (input, expected) => {
      expect(
        buildSentryOptions({
          dsn: 'https://key@o1.ingest.sentry.io/2',
          tracesSampleRate: input,
        })?.tracesSampleRate,
      ).toBe(expected)
    })
  })
})
