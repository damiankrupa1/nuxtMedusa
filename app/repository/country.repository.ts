import type { StoreRegionListResponse } from '@medusajs/types'
import { apiRepository } from './api.repository'

export function countryRepository() {
  const { request } = apiRepository()

  return {
    // Through server/api/regions, which caches Medusa's answer
    async listCountries(): Promise<StoreRegionListResponse> {
      return await request($fetch<StoreRegionListResponse>('/api/regions'))
    },
  }
}
