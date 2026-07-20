import type { StoreProductCategoryListParams } from '@medusajs/types'
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

export const useCategoryService = () => {
  const { listCategories, fetchCategoryByHandle } = categoryRepository()

  const getCategories = async (query?: StoreProductCategoryListParams) => {
    return await listCategories(query)
  }

  const getCategoryByHandle = async (handle: string) => {
    return await fetchCategoryByHandle(handle)
  }

  return {
    getCategories,
    getCategoryByHandle,
  }
}
