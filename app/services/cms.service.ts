import type { StoreProduct, StoreProductListParams } from '@medusajs/types'
import type {
  CmsCategoryTile,
  CmsCategoryTiles,
  ResolvedShopTheLook,
} from '../types/cms'
import { cmsRepository } from '../repository/cms.repository'
import { categoryRepository } from '../repository/category.repository'
import { productRepository } from '../repository/product.repository'

export const useCmsService = () => {
  const { fetchCategoryTiles, fetchShopTheLook } = cmsRepository()
  const { fetchCategoryByHandle } = categoryRepository()
  const { fetchProductByHandle } = productRepository()

  // CategoryTiles/ShopTheLook are editorial curation over real catalog
  // items: Payload supplies copy/images and a handle, Medusa stays the
  // source of truth for whether that handle still exists. A stale or
  // typo'd handle just drops that one card instead of linking to a 404.

  const getResolvedCategoryTiles = async (
    locale: string,
    medusaLocale?: string,
  ): Promise<CmsCategoryTiles | null> => {
    const tiles = await fetchCategoryTiles(locale)
    if (!tiles) return null

    const cards = await Promise.all(
      tiles.cards.map(async (card) => {
        const category = await fetchCategoryByHandle(
          card.categoryHandle,
          medusaLocale,
        )
        return category ? card : null
      }),
    )

    const resolvedCards = cards.filter(
      (card): card is CmsCategoryTile => card !== null,
    )
    return resolvedCards.length ? { ...tiles, cards: resolvedCards } : null
  }

  const getResolvedShopTheLook = async (
    locale: string,
    query?: StoreProductListParams,
    medusaLocale?: string,
  ): Promise<ResolvedShopTheLook | null> => {
    const look = await fetchShopTheLook(locale)
    if (!look) return null

    const products = await Promise.all(
      look.productHandles.map((handle) =>
        fetchProductByHandle(handle, query, medusaLocale),
      ),
    )

    const resolvedProducts = products.filter(
      (product): product is StoreProduct => product !== null,
    )
    if (!resolvedProducts.length) return null

    return { ...look, products: resolvedProducts }
  }

  return {
    getResolvedCategoryTiles,
    getResolvedShopTheLook,
  }
}
