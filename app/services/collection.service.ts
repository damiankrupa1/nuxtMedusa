import type { StoreCollectionFilters } from '@medusajs/types'
import { collectionRepository } from '../repository/collection.repository'

export const useCollectionService = () => {
  const { listCollections, fetchCollectionByHandle } = collectionRepository()

  const getCollections = async (query?: StoreCollectionFilters) => {
    return await listCollections(query)
  }

  const getCollectionByHandle = async (handle: string) => {
    return await fetchCollectionByHandle(handle)
  }

  return {
    getCollections,
    getCollectionByHandle,
  }
}
