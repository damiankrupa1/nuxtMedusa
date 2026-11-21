import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFetchCustomer } from '~/composables/customer'

// Issue #81: the customer is fetched in the server render of per-visitor
// pages (account, wishlist), with the visitor's cookie, so a signed-in
// customer's reload shows their account and not the sign-in form. A page
// shared through the CDN cache must render the same for every visitor, so
// there the customer is only fetched in the browser.
describe('useFetchCustomer', () => {
  const route = { meta: {} as Record<string, unknown> }
  const useLazyAsyncData = vi.fn()
  const requestFetch = vi.fn<(...args: unknown[]) => Promise<unknown>>()

  Object.assign(globalThis, {
    useLazyAsyncData,
    useRoute: () => route,
    useRequestFetch: () => requestFetch,
    useMedusaClient: () => ({}),
  })

  beforeEach(() => {
    vi.clearAllMocks()
    route.meta = {}
  })

  const lastOptions = () => useLazyAsyncData.mock.lastCall?.[2]

  it('fetches the customer in the server render of a per-visitor page', () => {
    useFetchCustomer()

    expect(useLazyAsyncData).toHaveBeenCalledWith(
      'customer',
      expect.any(Function),
      { server: true },
    )
  })

  it('fetches the customer in the browser only on a page shared through the CDN cache', () => {
    route.meta = { cdnCache: true }

    useFetchCustomer()

    expect(lastOptions()).toEqual({ server: false })
  })

  it('asks `me` with the request-bound fetch', async () => {
    requestFetch.mockResolvedValue({ customer: null })
    useFetchCustomer()
    const handler = useLazyAsyncData.mock
      .lastCall?.[1] as () => Promise<unknown>

    await expect(handler()).resolves.toEqual({ customer: null })
    expect(requestFetch).toHaveBeenCalledWith('/api/customers/me')
  })
})
