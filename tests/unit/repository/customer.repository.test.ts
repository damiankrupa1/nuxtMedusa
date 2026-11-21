import { beforeEach, describe, expect, it, vi } from 'vitest'

import { customerRepository } from '~/repository/customer.repository'

// Built by apiRepository(), never used by the customer calls
vi.mock('~/composables/medusa', () => ({ useMedusaClient: () => ({}) }))

// Issue #81: during a server render the global $fetch does not send the
// visitor's cookies, so `GET /api/customers/me` never saw the session cookie
// and a signed-in customer was rendered signed out. useRequestFetch() is the
// request-bound fetch (it forwards the page request's headers on the server
// and is $fetch itself in the browser), and `me` must go through it.
describe('customer repository (app)', () => {
  const globalFetch = vi.fn<(...args: unknown[]) => Promise<unknown>>()
  const requestFetch = vi.fn<(...args: unknown[]) => Promise<unknown>>()
  const useRequestFetch = vi.fn(() => requestFetch)
  const captureError = vi.fn()

  Object.assign(globalThis, {
    $fetch: globalFetch,
    useRequestFetch,
    captureError,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    requestFetch.mockResolvedValue({ customer: null })
    globalFetch.mockResolvedValue({ customer: null })
  })

  it('asks for the customer with the request-bound fetch, never the global $fetch', async () => {
    const customer = { id: 'cus_test' }
    requestFetch.mockResolvedValue({ customer })

    await expect(customerRepository().fetchCustomer()).resolves.toEqual({
      customer,
    })

    expect(requestFetch).toHaveBeenCalledWith('/api/customers/me')
    expect(globalFetch).not.toHaveBeenCalled()
  })

  it('takes the request-bound fetch when it is created, inside the Nuxt context', async () => {
    const repository = customerRepository()
    expect(useRequestFetch).toHaveBeenCalledTimes(1)

    // Called later (from the async-data handler), it reuses that fetch
    await repository.fetchCustomer()
    expect(useRequestFetch).toHaveBeenCalledTimes(1)
    expect(requestFetch).toHaveBeenCalledTimes(1)
  })

  it('reports a failure and passes it on, as before', async () => {
    const failure = new Error('Service Unavailable')
    requestFetch.mockRejectedValue(failure)

    await expect(customerRepository().fetchCustomer()).rejects.toBe(failure)
    expect(captureError).toHaveBeenCalledWith(failure, { source: 'medusa' })
  })
})
