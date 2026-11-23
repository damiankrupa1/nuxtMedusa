import type { APIRequestContext } from '@playwright/test'
import type {
  StoreCart,
  StoreCompleteCartResponse,
  StoreOrder,
  StoreRegion,
} from '@medusajs/types'
import {
  medusaBackendUrl,
  medusaPublishableKey,
} from '~~/tests/e2e/support/env'

// Direct Store API calls from the test process, to check what the browser
// did against the backend's own state (an order exists, a cart is completed).
// Same API and publishable key as the storefront, so only what any shopper
// may read; no admin access. Pass Playwright's `request` fixture, which has
// no cookies of the page.
export function storeApi(request: APIRequestContext) {
  const headers = { 'x-publishable-api-key': medusaPublishableKey }

  async function call<T>(
    method: 'GET' | 'POST',
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const response = await request.fetch(`${medusaBackendUrl}${path}`, {
      method,
      headers,
      params,
      failOnStatusCode: false,
    })
    if (!response.ok()) {
      throw new Error(
        `Store API ${method} ${path} answered ${response.status()}: ${await response.text()}`,
      )
    }
    return (await response.json()) as T
  }

  return {
    async retrieveCart(cartId: string): Promise<StoreCart> {
      const { cart } = await call<{ cart: StoreCart }>(
        'GET',
        `/store/carts/${cartId}`,
      )
      return cart
    },

    async retrieveOrder(orderId: string): Promise<StoreOrder> {
      const { order } = await call<{ order: StoreOrder }>(
        'GET',
        `/store/orders/${orderId}`,
        { fields: '*items,*payment_collections.payments' },
      )
      return order
    },

    // What the storefront's "place order" sends
    async completeCart(cartId: string): Promise<StoreCompleteCartResponse> {
      return await call<StoreCompleteCartResponse>(
        'POST',
        `/store/carts/${cartId}/complete`,
      )
    },

    async findRegionByCountry(countryCode: string): Promise<StoreRegion> {
      const { regions } = await call<{ regions: StoreRegion[] }>(
        'GET',
        '/store/regions',
        { fields: 'id,name,*countries' },
      )
      const region = regions.find((candidate) =>
        candidate.countries?.some(
          (country) => country.iso_2 === countryCode.toLowerCase(),
        ),
      )
      if (!region) {
        throw new Error(`The e2e Medusa has no region for "${countryCode}"`)
      }
      return region
    },

    async listPaymentProviderIds(regionId: string): Promise<string[]> {
      const { payment_providers: providers } = await call<{
        payment_providers: { id: string }[]
      }>('GET', '/store/payment-providers', { region_id: regionId })
      return providers.map(({ id }) => id)
    },
  }
}
