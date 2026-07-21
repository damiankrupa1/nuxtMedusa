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
