import { categoryRepository } from '../repository/category.repository'

export const useFetchCategories = () => {
  const { listCategories } = categoryRepository()

  return useLazyAsyncData(`categories`, async () => {
    return await listCategories()
  })
}

export const useFetchCategoryByHandle = (handle: string) => {
  const { fetchCategoryByHandle } = categoryRepository()

  return useLazyAsyncData(
    `category:${handle}`,
    async () => await fetchCategoryByHandle(handle),
  )
}
