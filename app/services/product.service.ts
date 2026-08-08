import type { StoreProductListParams } from '@medusajs/types'
import { productRepository } from '../repository/product.repository'

// TODO: unused (composables call productRepository directly) — remove if no logic is added here

export const useProductService = () => {
  const { listProducts, fetchProductByHandle } = productRepository()

  const getProducts = async (query: StoreProductListParams) => {
    return await listProducts(query)
  }

  const getProductByHandle = async (
    handle: string,
    query?: StoreProductListParams,
  ) => {
    return await fetchProductByHandle(handle, query)
  }

  return {
    getProducts,
    getProductByHandle,
  }
}
