import type { StoreCartShippingOption } from '@medusajs/types'
import type { InpostPoint } from '~/types/inpost'

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
 * Builds the shipping method `data` the InPost provider accepts: the point
 * name as `target_point` (all it routes the parcel by) plus the fields we
 * display as `target_point_details`. The provider rejects any other key.
 */
export function toInpostShippingData(
  point: InpostPoint,
): Record<string, unknown> {
  const data: Record<string, unknown> = { target_point: point.name }
  const { line1, line2 } = point.address ?? {}

  // The provider requires both address lines whenever details are sent.
  if (line1 && line2) {
    const { street, building_number, post_code, city } =
      point.address_details ?? {}

    data.target_point_details = {
      address: { line1, line2 },
      address_details: { street, building_number, post_code, city },
    }
  }

  return data
}

export function getInpostPoint(
  data?: Record<string, unknown> | null,
): InpostPoint | null {
  const name = data?.target_point
  if (typeof name !== 'string') return null

  const details = data?.target_point_details as
    Pick<InpostPoint, 'address' | 'address_details'> | undefined

  return {
    name,
    address: details?.address,
    address_details: details?.address_details,
  }
}
