import type { StoreRegionFilters } from '@medusajs/types'
import { useApiRepository } from './api.repository'

export function countryRepository() {
  const { client, request } = useApiRepository()

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
