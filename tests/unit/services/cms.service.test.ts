import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StoreProduct, StoreProductCategory } from '@medusajs/types'

import { useCmsService } from '~/services/cms.service'
import { cmsRepository } from '~/repository/cms.repository'
import { categoryRepository } from '~/repository/category.repository'
import { productRepository } from '~/repository/product.repository'
import type { CmsCategoryTiles, CmsShopTheLook } from '~/types/cms'

vi.mock('~/repository/cms.repository', () => ({
  cmsRepository: vi.fn(),
}))
vi.mock('~/repository/category.repository', () => ({
  categoryRepository: vi.fn(),
}))
vi.mock('~/repository/product.repository', () => ({
  productRepository: vi.fn(),
}))

describe('cms service', () => {
  const fetchCategoryTiles =
    vi.fn<(locale: string) => Promise<CmsCategoryTiles | null>>()
  const fetchShopTheLook =
    vi.fn<(locale: string) => Promise<CmsShopTheLook | null>>()
  const fetchCategoryByHandle =
    vi.fn<
      (
        handle: string,
        medusaLocale?: string,
      ) => Promise<StoreProductCategory | null>
    >()
  const fetchProductByHandle =
    vi.fn<
      (
        handle: string,
        query?: unknown,
        medusaLocale?: string,
      ) => Promise<StoreProduct | null>
    >()

  const image = { url: 'https://cms.example.com/media/x.jpg', alt: '' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cmsRepository).mockReturnValue({
      fetchNavigation: vi.fn(),
      fetchFooterContent: vi.fn(),
      fetchStudioStory: vi.fn(),
      fetchBrands: vi.fn(),
      fetchJournalSection: vi.fn(),
      fetchCampaignSlides: vi.fn(),
      fetchCategoryTiles,
      fetchShopTheLook,
    })
    vi.mocked(categoryRepository).mockReturnValue({
      listCategories: vi.fn(),
      fetchCategoryByHandle,
    })
    vi.mocked(productRepository).mockReturnValue({
      listProducts: vi.fn(),
      fetchProductByHandle,
    })
  })

  describe('getResolvedCategoryTiles', () => {
    it('drops cards whose categoryHandle no longer matches a real Medusa category', async () => {
      fetchCategoryTiles.mockResolvedValue({
        eyebrow: 'Shop',
        heading: 'By category',
        description: '...',
        cards: [
          {
            title: 'Knitwear',
            subtitle: '',
            categoryHandle: 'knitwear',
            image,
          },
          { title: 'Stale', subtitle: '', categoryHandle: 'gone', image },
        ],
      })
      fetchCategoryByHandle.mockImplementation(async (handle) =>
        handle === 'knitwear'
          ? ({ handle: 'knitwear' } as StoreProductCategory)
          : null,
      )

      const result = await useCmsService().getResolvedCategoryTiles('en')

      expect(result?.cards).toHaveLength(1)
      expect(result?.cards[0]?.categoryHandle).toBe('knitwear')
    })

    it('returns null when Payload has no CategoryTiles global', async () => {
      fetchCategoryTiles.mockResolvedValue(null)

      expect(await useCmsService().getResolvedCategoryTiles('en')).toBeNull()
      expect(fetchCategoryByHandle).not.toHaveBeenCalled()
    })

    it('returns null when none of the curated handles resolve', async () => {
      fetchCategoryTiles.mockResolvedValue({
        eyebrow: '',
        heading: '',
        description: '',
        cards: [
          { title: 'Stale', subtitle: '', categoryHandle: 'gone', image },
        ],
      })
      fetchCategoryByHandle.mockResolvedValue(null)

      expect(await useCmsService().getResolvedCategoryTiles('en')).toBeNull()
    })
  })

  describe('getResolvedShopTheLook', () => {
    it('attaches the resolved products and drops handles that no longer match', async () => {
      fetchShopTheLook.mockResolvedValue({
        eyebrow: 'Look',
        headlineLine1: '',
        headlineLine2: '',
        description: '',
        captionLabel: '',
        bottomTagline: '',
        shopSetCtaLabel: '',
        totalLabel: '',
        sizeHint: '',
        productHandles: ['jacket', 'gone'],
        image,
      })
      fetchProductByHandle.mockImplementation(async (handle) =>
        handle === 'jacket'
          ? ({ id: 'prod_1', handle: 'jacket' } as StoreProduct)
          : null,
      )

      const result = await useCmsService().getResolvedShopTheLook('en')

      expect(result?.products).toEqual([{ id: 'prod_1', handle: 'jacket' }])
    })

    it('returns null when Payload has no ShopTheLook global', async () => {
      fetchShopTheLook.mockResolvedValue(null)

      expect(await useCmsService().getResolvedShopTheLook('en')).toBeNull()
      expect(fetchProductByHandle).not.toHaveBeenCalled()
    })

    it('returns null when none of the curated handles resolve', async () => {
      fetchShopTheLook.mockResolvedValue({
        eyebrow: '',
        headlineLine1: '',
        headlineLine2: '',
        description: '',
        captionLabel: '',
        bottomTagline: '',
        shopSetCtaLabel: '',
        totalLabel: '',
        sizeHint: '',
        productHandles: ['gone'],
        image,
      })
      fetchProductByHandle.mockResolvedValue(null)

      expect(await useCmsService().getResolvedShopTheLook('en')).toBeNull()
    })
  })
})
