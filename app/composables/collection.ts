import { collectionRepository } from '../repository/collection.repository'

export const useFetchCollectionByHandle = (handle: string) => {
  const { locale } = useI18n()
  const { fetchCollectionByHandle } = collectionRepository()
  const medusaLocale = toMedusaLocale(locale.value)

  return useLazyAsyncData(
    `collection:${handle}:${medusaLocale}`,
    async () => await fetchCollectionByHandle(handle, medusaLocale),
  )
}
