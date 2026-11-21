// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type Medusa from '@medusajs/js-sdk'
import type { EventHandler, H3Event } from 'h3'
import { createError, isError } from 'h3'
import { defineWrappedResponseHandler } from '~~/server/utils/handler'
import { serverMedusaClient } from '~~/server/utils/medusa'
import { medusaCustomerResponse } from '~~/tests/fixtures/medusa'

vi.mock('~~/server/utils/medusa', () => ({ serverMedusaClient: vi.fn() }))

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
  vi.mocked(serverMedusaClient).mockReturnValue(medusa as unknown as Medusa)
  getCookie.mockReturnValue(undefined)
  readBody.mockResolvedValue({ first_name: 'Ada', last_name: 'Lovelace' })
  updateCustomer.mockResolvedValue(medusaCustomerResponse)
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

    await expect(handler(event)).resolves.toEqual(medusaCustomerResponse)
    expect(updateCustomer).toHaveBeenCalledWith(
      { first_name: 'Ada', last_name: 'Lovelace' },
      {},
      { Authorization: 'Bearer test-token' },
    )
  })
})
