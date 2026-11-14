import type { H3Event } from 'h3'
import { serverMedusaClient } from '#medusa/server'
import type { StoreRegionListResponse } from '@medusajs/types'
import type { SitemapCatalogItem } from '~/types/seo'
import { captureError } from '~/utils/capture-error'
import { listAllPages } from '~~/server/utils/pagination'
import type { MedusaError } from '~~/server/types/medusa-error'

const REGION_FIELDS =
  'id,countries.iso_2,countries.name,countries.display_name,countries.region_id'
const SITEMAP_FIELDS = 'handle,updated_at'

// The only place on the server that knows the shape of the Medusa Store API
// calls the handlers need (which fields, how a list is paged). A failure of
// Medusa is reported here, once, with `source: 'medusa'` (a 4xx stays a
// breadcrumb, see isExpectedError()), and becomes an H3 error carrying
// Medusa's status (500 without one) and the reported error as `cause`, so
// Sentry's Nitro hook doesn't report that H3 error again and neither does the
// handler. `serverMedusaClient()` is typed `any`; this file is the one place
// that narrows it.
export function medusaRepository(event: H3Event) {
  const medusa = serverMedusaClient(event)

  async function request<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call()
    } catch (error) {
      captureError(error, { source: 'medusa' })

      const medusaError = error as MedusaError
      throw createError({
        statusCode: medusaError.status || 500,
        message: medusaError.message || 'Internal Server Error',
        cause: error,
      })
    }
  }

  return {
    listRegions(): Promise<StoreRegionListResponse> {
      return request(() => medusa.store.region.list({ fields: REGION_FIELDS }))
    },

    // Every product, category and collection that has a page of its own,
    // reduced to what the sitemap needs (handle, updated_at)
    listSitemapCatalog(): Promise<{
      products: SitemapCatalogItem[]
      categories: SitemapCatalogItem[]
      collections: SitemapCatalogItem[]
    }> {
      return request(async () => {
        const [products, categories, collections] = await Promise.all([
          listAllPages<SitemapCatalogItem>(async (page) => {
            const { products, count } = await medusa.store.product.list({
              fields: SITEMAP_FIELDS,
              ...page,
            })
            return { items: products, count }
          }),
          listAllPages<SitemapCatalogItem>(async (page) => {
            const { product_categories, count } =
              await medusa.store.category.list({
                fields: SITEMAP_FIELDS,
                ...page,
              })
            return { items: product_categories, count }
          }),
          listAllPages<SitemapCatalogItem>(async (page) => {
            const { collections, count } = await medusa.store.collection.list({
              fields: SITEMAP_FIELDS,
              ...page,
            })
            return { items: collections, count }
          }),
        ])
        return { products, categories, collections }
      })
    },
  }
}
