import type { StoreProductListParams } from '@medusajs/types'
import { SORT_OPTIONS } from '../types/filter'
import { apiRepository } from './api.repository'

export function productRepository() {
  const { client, request } = apiRepository()

  return {
    async listProducts(query: StoreProductListParams, medusaLocale?: string) {
      return await request(
        client.store.product.list(
          {
            fields:
              '*variants,*variants.calculated_price,+variants.inventory_quantity,*options,*options.values',
            order: SORT_OPTIONS.CREATED_AT,
            ...query,
          },
          medusaLocaleHeaders(medusaLocale),
        ),
      )
    },

    async fetchProductByHandle(
      handle: string,
      query?: StoreProductListParams,
      medusaLocale?: string,
    ) {
      const response = await request(
        client.store.product.list(
          {
            fields:
              '*variants,*variants.calculated_price,+variants.inventory_quantity',
            handle,
            ...query,
          },
          medusaLocaleHeaders(medusaLocale),
        ),
      )

      return response.products?.[0] ?? null
    },
  }
}
