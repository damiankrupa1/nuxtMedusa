import type { StoreRegionCountry } from '@medusajs/types'

// Fix API type
export interface BaseRegionCountryWithRegionId extends StoreRegionCountry {
  region_id: string
}
