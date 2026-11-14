import type { StoreRegionListResponse } from '@medusajs/types'
import { medusaRepository } from '~~/server/repository/medusa.repository'
import { getCountriesFromRegions } from '~/utils/country'
import { buildCatalogSitemapUrls, toCountryCodes } from '~/utils/seo'

// Source of /sitemap.xml (@nuxtjs/sitemap, see nuxt.config.ts): the catalog
// pages of every country in the Medusa regions. Cached like /api/regions, so
// a crawler hitting the sitemap (or this route) doesn't walk the whole
// catalog in Medusa each time; a failed walk is not cached. The handler only
// does HTTP (cache, the internal /api/regions request); the catalog walk and
// its error handling live in server/repository/medusa.repository.ts.
export default defineCachedEventHandler(
  async (event) => {
    const [{ regions }, { products, categories, collections }] =
      await Promise.all([
        event.$fetch<StoreRegionListResponse>('/api/regions'),
        medusaRepository(event).listSitemapCatalog(),
      ])

    return buildCatalogSitemapUrls({
      countryCodes: toCountryCodes(getCountriesFromRegions(regions)),
      products,
      categories,
      collections,
    })
  },
  { name: 'sitemap-urls', maxAge: 60 * 10, staleMaxAge: 60 * 60, swr: true },
)
