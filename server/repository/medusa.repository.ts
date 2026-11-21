import type { H3Event } from 'h3'
import type { StoreRegionListResponse } from '@medusajs/types'
import {
  MEDUSA_REGION_FIELDS,
  medusaRegionListResponseSchema,
} from '~/types/country'
import { MEDUSA_RESPONSE_POLICY } from '~/types/medusa'
import type { SitemapCatalogItem } from '~/types/seo'
import { captureError } from '~/utils/capture-error'
import { parseMedusaResponse } from '~/utils/medusa-response'
import { serverMedusaClient } from '~~/server/utils/medusa'
import { listAllPages } from '~~/server/utils/pagination'
import type { MedusaError } from '~~/server/types/medusa-error'

const SITEMAP_FIELDS = 'handle,updated_at'

// The only place on the server that knows the shape of the Medusa Store API
// calls the handlers need (which fields, how a list is paged). A failure of
// Medusa is reported here, once, with `source: 'medusa'` (a 4xx stays a
// breadcrumb, see isExpectedError()), and becomes an H3 error carrying
// Medusa's status (500 without one) and the reported error as `cause`, so
// Sentry's Nitro hook doesn't report that H3 error again and neither does the
// handler.
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
    // Checked with the soft policy (#84): the regions drive the routing of
    // every page, so an answer without what it needs (a country's `iso_2` or
    // `region_id`) is reported once (`invalid_response`) and treated like a
    // regions outage, a 502: not cached, so /api/regions keeps serving its
    // last valid copy while it has one (SWR), and the pages render as
    // without regions otherwise. Never an empty or partial list, which the
    // cache would keep for 10 minutes and which would redirect every URL of
    // a missing country. The cause is the reported error (the same one on
    // every repeat), so Sentry's Nitro hook doesn't report the 502 again.
    async listRegions(): Promise<StoreRegionListResponse> {
      const answer = await request(() =>
        medusa.store.region.list({ fields: MEDUSA_REGION_FIELDS }),
      )
      const result = parseMedusaResponse(
        medusaRegionListResponseSchema,
        answer,
        'regions',
        MEDUSA_RESPONSE_POLICY.soft,
      )
      if (!result.success) {
        throw createError({
          statusCode: 502,
          message: result.error.message,
          cause: result.error,
        })
      }

      return result.data
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
