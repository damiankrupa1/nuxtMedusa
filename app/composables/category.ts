import { categoryRepository } from '../repository/category.repository'

export const useFetchCategories = () => {
  const { locale } = useI18n()
  const { listCategories } = categoryRepository()
  const medusaLocale = toMedusaLocale(locale.value)

  return useLazyAsyncData(`categories:${medusaLocale}`, async () => {
    return await listCategories(undefined, medusaLocale)
  })
}

export const useFetchCategoryByHandle = (handle: string) => {
  const { locale } = useI18n()
  const { fetchCategoryByHandle } = categoryRepository()
  const medusaLocale = toMedusaLocale(locale.value)

  return useLazyAsyncData(
    `category:${handle}:${medusaLocale}`,
    async () => await fetchCategoryByHandle(handle, medusaLocale),
  )
}
