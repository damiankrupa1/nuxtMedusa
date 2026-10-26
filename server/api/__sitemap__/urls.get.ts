import type { StoreRegionListResponse } from '@medusajs/types'
import { serverMedusaClient } from '#medusa/server'
import { getCountriesFromRegions } from '~/utils/country'
import type { SitemapCatalogItem } from '~/types/seo'
import { buildCatalogSitemapUrls, toCountryCodes } from '~/utils/seo'

// Source of /sitemap.xml (@nuxtjs/sitemap, see nuxt.config.ts): the catalog
// pages of every country in the Medusa regions. Cached like /api/regions, so
// a crawler hitting the sitemap (or this route) doesn't walk the whole
// catalog in Medusa each time; a failed walk is not cached.
export default defineCachedEventHandler(
  defineWrappedResponseHandler(async (event) => {
    const medusa = serverMedusaClient(event)
    const fields = 'handle,updated_at'

    const [{ regions }, products, categories, collections] = await Promise.all([
      event.$fetch<StoreRegionListResponse>('/api/regions'),
      listAllPages<SitemapCatalogItem>(async (page) => {
        const { products, count } = await medusa.store.product.list({
          fields,
          ...page,
        })
        return { items: products, count }
      }),
      listAllPages<SitemapCatalogItem>(async (page) => {
        const { product_categories, count } = await medusa.store.category.list({
          fields,
          ...page,
        })
        return { items: product_categories, count }
      }),
      listAllPages<SitemapCatalogItem>(async (page) => {
        const { collections, count } = await medusa.store.collection.list({
          fields,
          ...page,
        })
        return { items: collections, count }
      }),
    ])

    return buildCatalogSitemapUrls({
      countryCodes: toCountryCodes(getCountriesFromRegions(regions)),
      products,
      categories,
      collections,
    })
  }),
  { name: 'sitemap-urls', maxAge: 60 * 10, staleMaxAge: 60 * 60, swr: true },
)
