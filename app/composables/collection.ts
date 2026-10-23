import { collectionRepository } from '../repository/collection.repository'

export const useFetchCollections = () => {
  const { locale } = useI18n()
  const { listCollections } = collectionRepository()
  const medusaLocale = toMedusaLocale(locale.value)

  return useLazyAsyncData(`collections:${medusaLocale}`, async () => {
    return await listCollections(undefined, medusaLocale)
  })
}

export const useFetchCollectionByHandle = (handle: string) => {
  const { locale } = useI18n()
  const { fetchCollectionByHandle } = collectionRepository()
  const medusaLocale = toMedusaLocale(locale.value)

  return useLazyAsyncData(
    `collection:${handle}:${medusaLocale}`,
    async () => await fetchCollectionByHandle(handle, medusaLocale),
  )
}
