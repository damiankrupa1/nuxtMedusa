import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { H3Event } from 'h3'

import * as Sentry from '@sentry/nuxt'
import { defineWrappedResponseHandler } from '~~/server/utils/handler'

// Nitro auto-imports these in the server; the handler only needs these two
Object.assign(globalThis, {
  defineEventHandler: (handler: unknown) => handler,
  createError: (input: Record<string, unknown>) =>
    Object.assign(new Error(String(input.message)), input),
})

describe('defineWrappedResponseHandler', () => {
  const event = {} as H3Event

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    jest.mocked(Sentry.isEnabled).mockReturnValue(true)
  })

  it('returns what the handler returns', async () => {
    const handler = defineWrappedResponseHandler(async () => ({ ok: true }))

    await expect(handler(event)).resolves.toEqual({ ok: true })
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('reports an unexpected error and rethrows it as a 500 with the cause', async () => {
    const failure = new Error('database down')
    const handler = defineWrappedResponseHandler(async () => {
      throw failure
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 500,
      message: 'database down',
      cause: failure,
    })
    expect(Sentry.captureException).toHaveBeenCalledWith(failure, {
      tags: { source: 'server-api' },
      extra: {},
    })
  })

  it('keeps the status of a Medusa 4xx without reporting it as an event', async () => {
    const handler = defineWrappedResponseHandler(async () => {
      throw Object.assign(new Error('Invalid email or password'), {
        status: 401,
      })
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1)
  })
})
