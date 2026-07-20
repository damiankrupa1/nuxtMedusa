import type { StoreCollectionFilters } from '@medusajs/types'
import { collectionRepository } from '../repository/collection.repository'

export const useFetchCollections = () => {
  const { listCollections } = collectionRepository()

  return useLazyAsyncData(`collections`, async () => {
    return await listCollections()
  })
}

export const useFetchCollectionByHandle = (handle: string) => {
  const { fetchCollectionByHandle } = collectionRepository()

  return useLazyAsyncData(
    `collection:${handle}`,
    async () => await fetchCollectionByHandle(handle),
  )
}

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
