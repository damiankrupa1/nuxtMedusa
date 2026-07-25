import type { StoreProductCategoryListParams } from '@medusajs/types'
import { apiRepository } from './api.repository'

export function categoryRepository() {
  const { client, request } = apiRepository()

  return {
    async listCategories(query?: StoreProductCategoryListParams) {
      return await request(
        client.store.category.list({
          fields: 'handle,name,*parent_category,*category_children',
          ...query,
        }),
      )
    },

    async fetchCategoryByHandle(handle: string) {
      const response = await request(
        client.store.category.list({
          handle,
          fields: 'handle,name',
        }),
      )

      return response.product_categories?.[0] ?? null
    },
  }
}
