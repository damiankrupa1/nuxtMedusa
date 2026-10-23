import type { StoreProductCategoryListParams } from '@medusajs/types'
import { apiRepository } from './api.repository'

export function categoryRepository() {
  const { client, request } = apiRepository()

  return {
    async listCategories(
      query?: StoreProductCategoryListParams,
      medusaLocale?: string,
    ) {
      return await request(
        client.store.category.list(
          {
            fields: 'handle,name,*parent_category,*category_children',
            ...query,
          },
          medusaLocaleHeaders(medusaLocale),
        ),
      )
    },

    async fetchCategoryByHandle(handle: string, medusaLocale?: string) {
      const response = await request(
        client.store.category.list(
          {
            handle,
            fields: 'handle,name',
          },
          medusaLocaleHeaders(medusaLocale),
        ),
      )

      return response.product_categories?.[0] ?? null
    },
  }
}
