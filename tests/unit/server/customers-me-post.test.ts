// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventHandler, H3Event } from 'h3'
import { createError, isError } from 'h3'
import { serverMedusaClient } from '#medusa/server'
import { defineWrappedResponseHandler } from '~~/server/utils/handler'

const readBody = vi.fn()
const getCookie = vi.fn()
const updateCustomer = vi.fn()
const medusa = { store: { customer: { update: updateCustomer } } }
const event = {} as H3Event

Object.assign(globalThis, {
  createError,
  isError,
  defineEventHandler: (handler: unknown) => handler,
  defineWrappedResponseHandler,
  getCookie,
  readBody,
})

let handler: EventHandler

beforeAll(async () => {
  handler = (await import('~~/server/api/customers/me.post')).default
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(serverMedusaClient).mockReturnValue(medusa)
  getCookie.mockReturnValue(undefined)
  readBody.mockResolvedValue({ first_name: 'Ada', last_name: 'Lovelace' })
  updateCustomer.mockResolvedValue({ customer: { id: 'cus_test' } })
})

describe('POST /api/customers/me', () => {
  it('returns 401 without a token and makes no Medusa request', async () => {
    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Unauthorized',
    })
    expect(serverMedusaClient).not.toHaveBeenCalled()
    expect(updateCustomer).not.toHaveBeenCalled()
  })

  it('forwards the cookie token as the Authorization header', async () => {
    getCookie.mockReturnValue('test-token')

    await expect(handler(event)).resolves.toEqual({
      customer: { id: 'cus_test' },
    })
    expect(updateCustomer).toHaveBeenCalledWith(
      { first_name: 'Ada', last_name: 'Lovelace' },
      {},
      { Authorization: 'Bearer test-token' },
    )
  })
})
