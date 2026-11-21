import { z } from '~/utils/zod'
import type {
  StoreRegion,
  StoreRegionCountry,
  StoreRegionListResponse,
} from '@medusajs/types'
import type { MedusaResponseShape } from '~/types/medusa'

// Fix API type
export interface BaseRegionCountryWithRegionId extends StoreRegionCountry {
  region_id: string
}

// What server/repository/medusa.repository.ts asks Medusa for the regions
// (`GET /store/regions`), which the region middleware routes on
export const MEDUSA_REGION_FIELDS =
  'id,countries.iso_2,countries.name,countries.display_name,countries.region_id'

// Medusa's regions answer, checked with parseMedusaResponse() and the soft
// policy (#84): only what the storefront reads. A country's `iso_2` (the URL
// prefix) and `region_id` (the key of every catalog and cart call) are
// required; `name` (sorting; a country without one is left out) and
// `display_name` (shown) may be missing, as the SDK type allows. Used on the
// server only, so it stays out of the client bundle.
const medusaRegionCountrySchema = z.looseObject({
  iso_2: z.string().min(1),
  region_id: z.string().min(1),
  name: z.string().optional(),
  display_name: z.string().optional(),
} satisfies MedusaResponseShape<BaseRegionCountryWithRegionId>)

export const medusaRegionListResponseSchema = z.looseObject({
  regions: z.array(
    z.looseObject({
      countries: z.array(medusaRegionCountrySchema).optional(),
    } satisfies MedusaResponseShape<StoreRegion>),
  ),
} satisfies MedusaResponseShape<StoreRegionListResponse>)
