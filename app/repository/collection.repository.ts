import type { StoreCollectionFilters } from '@medusajs/types'
import { apiRepository } from './api.repository'

export function collectionRepository() {
  const { client, request } = apiRepository()

  return {
    async listCollections(query?: StoreCollectionFilters) {
      return await request(
        client.store.collection.list({
          fields: 'handle,title',
          ...query,
        }),
      )
    },

    async fetchCollectionByHandle(handle: string) {
      const response = await request(
        client.store.collection.list({
          handle,
          fields: 'handle,title',
        }),
      )
      return response.collections?.[0] ?? null
    },
  }
}
