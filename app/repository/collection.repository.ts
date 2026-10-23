import type { StoreCollectionFilters } from '@medusajs/types'
import { apiRepository } from './api.repository'

export function collectionRepository() {
  const { client, request } = apiRepository()

  return {
    async listCollections(
      query?: StoreCollectionFilters,
      medusaLocale?: string,
    ) {
      return await request(
        client.store.collection.list(
          {
            fields: 'handle,title',
            ...query,
          },
          medusaLocaleHeaders(medusaLocale),
        ),
      )
    },

    async fetchCollectionByHandle(handle: string, medusaLocale?: string) {
      const response = await request(
        client.store.collection.list(
          {
            handle,
            fields: 'handle,title',
          },
          medusaLocaleHeaders(medusaLocale),
        ),
      )
      return response.collections?.[0] ?? null
    },
  }
}
