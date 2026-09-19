import type { StoreProductCategoryListParams } from '@medusajs/types'
import { categoryRepository } from '../repository/category.repository'

// TODO: unused (composables call categoryRepository directly) — remove if no logic is added here

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
