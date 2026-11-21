import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z, ZodError } from 'zod'
import * as Sentry from '@sentry/nuxt'

import { MEDUSA_RESPONSE_POLICY } from '~/types/medusa'
import { parseMedusaResponse } from '~/utils/medusa-response'
import { resetReportedOnce } from '~/utils/report-once'

// @sentry/nuxt is mocked for every test in tests/setup.ts

type Answer = { token?: string; customer?: { id: string; email?: string } }

const schema = z.looseObject({
  token: z.string().min(1),
  customer: z.looseObject({ id: z.string().min(1) }),
})

// A secret-looking value, to show the answer never reaches a message, a
// cause or a Sentry event
const secret = 'eyJhbGciOiJIUzI1NiJ9.c2VjcmV0.c2lnbmF0dXJl'
const valid: Answer = {
  token: secret,
  customer: { id: 'cus_1', email: 'ada@example.com' },
}

const sentryEvents = () => vi.mocked(Sentry.captureException).mock.calls

beforeEach(() => {
  vi.clearAllMocks()
  resetReportedOnce()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.mocked(Sentry.isEnabled).mockReturnValue(true)
})

describe('parseMedusaResponse, hard', () => {
  it('returns the answer itself when it matches, extra fields included', () => {
    const answer = { ...valid, added_by_medusa: true }

    expect(
      parseMedusaResponse(schema, answer, 'login', MEDUSA_RESPONSE_POLICY.hard),
    ).toBe(answer)
    expect(sentryEvents()).toHaveLength(0)
  })

  it('throws a fixed message with the zod issues as its cause and reports nothing', () => {
    const answer: Answer = { token: '', customer: { id: 'cus_1' } }

    let thrown: unknown
    try {
      parseMedusaResponse(schema, answer, 'login', MEDUSA_RESPONSE_POLICY.hard)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toBe(
      'Unexpected login response from Medusa',
    )
    const cause = (thrown as Error).cause
    expect(cause).toBeInstanceOf(ZodError)
    expect((cause as ZodError).issues).toMatchObject([
      { path: ['token'], code: 'too_small' },
    ])
    // The caller's error path reports it (the handler wrapper, request())
    expect(sentryEvents()).toHaveLength(0)
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled()
  })

  it('leaves the received values out of the error', () => {
    const answer = { token: 42, customer: { id: secret.length } }

    let thrown: Error | undefined
    try {
      parseMedusaResponse(
        schema,
        answer as unknown as Answer,
        'login',
        MEDUSA_RESPONSE_POLICY.hard,
      )
    } catch (error) {
      thrown = error as Error
    }

    const text = `${thrown?.message} ${(thrown?.cause as Error).message}`
    expect(text).not.toContain('42')
    expect(text).toContain('expected string, received number')
  })
})

describe('parseMedusaResponse, soft', () => {
  it('returns the answer itself when it matches', () => {
    const result = parseMedusaResponse(
      schema,
      valid,
      'regions',
      MEDUSA_RESPONSE_POLICY.soft,
    )

    expect(result).toEqual({ success: true, data: valid })
    expect(result.success && result.data).toBe(valid)
    expect(sentryEvents()).toHaveLength(0)
  })

  it('reports a mismatch with the issues as paths, codes and messages, never the answer', () => {
    const answer = { token: secret, customer: { email: 'ada@example.com' } }

    const result = parseMedusaResponse(
      schema,
      answer as unknown as Answer,
      'regions',
      MEDUSA_RESPONSE_POLICY.soft,
    )

    expect(result.success).toBe(false)
    expect(sentryEvents()).toHaveLength(1)
    const [error, hint] = sentryEvents()[0] ?? []
    expect(error).toBe(!result.success && result.error)
    expect((error as Error).message).toBe(
      'Unexpected regions response from Medusa',
    )
    expect((error as Error).cause).toBeInstanceOf(ZodError)
    expect(hint).toEqual({
      tags: { source: 'medusa', error_type: 'invalid_response' },
      extra: {
        response: 'regions',
        issues: [
          {
            code: 'invalid_type',
            path: 'customer.id',
            message: 'Invalid input: expected string, received undefined',
          },
        ],
      },
    })
    const sent = JSON.stringify(sentryEvents()) + (error as Error).message
    expect(sent).not.toContain(secret)
    expect(sent).not.toContain('ada@example.com')
  })

  it('reports the same failure once and hands out the same error every time', () => {
    const answer = { customer: { id: 'cus_1' } } as Answer

    const first = parseMedusaResponse(
      schema,
      answer,
      'regions',
      MEDUSA_RESPONSE_POLICY.soft,
    )
    const second = parseMedusaResponse(
      schema,
      { ...answer },
      'regions',
      MEDUSA_RESPONSE_POLICY.soft,
    )

    expect(sentryEvents()).toHaveLength(1)
    expect(first.success || second.success).toBe(false)
    expect(!second.success && second.error).toBe(!first.success && first.error)
  })

  it('reports a different failure, or the same one of another answer, again', () => {
    const missingToken = { customer: { id: 'cus_1' } } as Answer
    const missingCustomer = { token: 'x' } as Answer

    parseMedusaResponse(
      schema,
      missingToken,
      'regions',
      MEDUSA_RESPONSE_POLICY.soft,
    )
    parseMedusaResponse(
      schema,
      missingCustomer,
      'regions',
      MEDUSA_RESPONSE_POLICY.soft,
    )
    parseMedusaResponse(
      schema,
      missingToken,
      'customer',
      MEDUSA_RESPONSE_POLICY.soft,
    )

    expect(sentryEvents()).toHaveLength(3)
  })
})
