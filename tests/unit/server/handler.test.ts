/**
 * @jest-environment node
 */
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals'
import type { H3Event } from 'h3'
import { createError, isError } from 'h3'

import * as Sentry from '@sentry/nuxt'
import { defineWrappedResponseHandler } from '~~/server/utils/handler'

// Nitro auto-imports these in server code; the handler itself is all the
// tests need from defineEventHandler.
beforeAll(() => {
  Object.assign(globalThis, {
    createError,
    isError,
    defineEventHandler: (handler: unknown) => handler,
  })
})

const event = {} as H3Event

const run = async (error: unknown) => {
  const handler = defineWrappedResponseHandler(async () => {
    throw error
  })
  try {
    await handler(event)
  } catch (thrown) {
    return thrown
  }
  throw new Error('Expected the handler to throw')
}

describe('defineWrappedResponseHandler', () => {
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

  it('keeps a validation 400 and its issues instead of turning it into a 500, and does not report it', async () => {
    const validationError = createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: { formErrors: [], fieldErrors: { email: ['Invalid email'] } },
    })

    const error = await run(validationError)

    expect(error).toBe(validationError)
    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled()
  })

  it('reports an unexpected error and rethrows it as a 500 with the cause', async () => {
    const failure = new Error('database down')

    const error = await run(failure)

    expect(error).toMatchObject({
      statusCode: 500,
      message: 'database down',
      cause: failure,
    })
    expect(Sentry.captureException).toHaveBeenCalledWith(failure, {
      tags: { source: 'server-api' },
      extra: {},
    })
  })

  it('answers an error without a message with a generic 500', async () => {
    const error = await run(new Error(''))

    expect(error).toMatchObject({
      statusCode: 500,
      message: 'Internal Server Error',
    })
  })

  it('keeps the status and message of a Medusa 4xx without reporting it as an event', async () => {
    const error = await run(
      Object.assign(new Error('Invalid email or password'), { status: 401 }),
    )

    expect(error).toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    })
    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1)
  })
})
