import type { StoreCartShippingOption } from '@medusajs/types'

/** The part of the Geowidget `PointInterface` the storefront relies on. */
export interface InpostPoint {
  name: string
  address_details?: {
    street?: string
    building_number?: string
    city?: string
    post_code?: string
  }
}

// Key under which the chosen point is stored in the shipping method's `data`.
const INPOST_POINT_DATA_KEY = 'inpost_point'

// `data.id` the fulfillment provider sets on its parcel locker shipping option.
const INPOST_LOCKER_OPTION_ID = 'inpost_locker_standard'

export function isInpostShippingOption(
  option: Pick<StoreCartShippingOption, 'data'>,
): boolean {
  return option.data?.id === INPOST_LOCKER_OPTION_ID
}

export function formatInpostPointAddress(point: InpostPoint): string {
  const { street, building_number, post_code, city } =
    point.address_details ?? {}

  return [
    [street, building_number].filter(Boolean).join(' '),
    [post_code, city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ')
}

/**
 * Builds the shipping method `data` for an InPost point, keeping only the
 * fields we display instead of the whole Geowidget payload.
 */
export function toInpostShippingData(
  point: InpostPoint,
): Record<string, unknown> {
  const { street, building_number, post_code, city } =
    point.address_details ?? {}

  return {
    [INPOST_POINT_DATA_KEY]: {
      name: point.name,
      address_details: { street, building_number, post_code, city },
    },
  }
}

export function getInpostPoint(
  data?: Record<string, unknown> | null,
): InpostPoint | null {
  const point = data?.[INPOST_POINT_DATA_KEY] as InpostPoint | undefined
  return typeof point?.name === 'string' ? point : null
}
