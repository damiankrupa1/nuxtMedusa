import type { StoreRegionFilters } from '@medusajs/types'
import { apiRepository } from './api.repository'

export function countryRepository() {
  const { client, request } = apiRepository()

  return {
    async listCountries(query?: StoreRegionFilters) {
      return await request(
        client.store.region.list({
          fields:
            'id,countries.iso_2,countries.name,countries.display_name,countries.region_id',
          ...query,
        }),
      )
    },
  }
}
