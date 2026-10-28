/**
 * @jest-environment node
 */
import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals'
import type { H3Event } from 'h3'
import { createError, isError } from 'h3'

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
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    consoleError.mockClear()
  })

  it('passes the handler result through', async () => {
    const handler = defineWrappedResponseHandler(async () => ({ ok: true }))

    await expect(handler(event)).resolves.toEqual({ ok: true })
  })

  it('keeps a validation 400 and its issues instead of turning it into a 500', async () => {
    const validationError = createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: { formErrors: [], fieldErrors: { email: ['Invalid email'] } },
    })

    const error = await run(validationError)

    expect(error).toBe(validationError)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('answers a Medusa error with its status and message', async () => {
    const medusaError = Object.assign(new Error('Invalid email or password'), {
      status: 401,
    })

    const error = await run(medusaError)

    expect(error).toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  })

  it('answers any other error with a 500', async () => {
    const error = await run(new Error(''))

    expect(error).toMatchObject({
      statusCode: 500,
      message: 'Internal Server Error',
    })
  })
})
