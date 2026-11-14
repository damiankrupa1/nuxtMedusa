import type { StoreCartShippingOption } from '@medusajs/types'
import { describe, expect, it } from 'vitest'

import {
  formatInpostPointAddress,
  getInpostPoint,
  isInpostShippingOption,
  toInpostShippingData,
} from '~/utils/inpost'
import type { InpostPoint } from '~/types/inpost'

describe('inpost utils', () => {
  const makeOption = (
    data: StoreCartShippingOption['data'],
  ): Pick<StoreCartShippingOption, 'data'> => ({ data })

  const point: InpostPoint = {
    name: 'KRA010',
    address: { line1: 'Długa 12', line2: '30-001 Kraków' },
    address_details: {
      street: 'Długa',
      building_number: '12',
      post_code: '30-001',
      city: 'Kraków',
    },
  }

  it('recognises the InPost locker option by its data id', () => {
    expect(
      isInpostShippingOption(makeOption({ id: 'inpost_locker_standard' })),
    ).toBe(true)
  })

  it('does not treat other shipping options as InPost', () => {
    expect(isInpostShippingOption(makeOption(null))).toBe(false)
    expect(isInpostShippingOption(makeOption({}))).toBe(false)
    expect(
      isInpostShippingOption(makeOption({ id: 'inpost_courier_standard' })),
    ).toBe(false)
  })

  it('formats the point address and skips missing parts', () => {
    expect(formatInpostPointAddress(point)).toBe('Długa 12, 30-001 Kraków')
    expect(
      formatInpostPointAddress({
        name: 'KRA010',
        address_details: { post_code: '30-001', city: 'Kraków' },
      }),
    ).toBe('30-001 Kraków')
    expect(formatInpostPointAddress({ name: 'KRA010' })).toBe('')
  })

  it('sends the point name as target_point with only the displayed details', () => {
    const geowidgetPoint = {
      ...point,
      image_url: 'https://example.com/point.jpg',
      location: { latitude: 50.06, longitude: 19.94 },
    }

    expect(toInpostShippingData(geowidgetPoint)).toEqual({
      target_point: 'KRA010',
      target_point_details: {
        address: point.address,
        address_details: point.address_details,
      },
    })
  })

  it('sends only target_point when an address line is missing', () => {
    expect(
      toInpostShippingData({ ...point, address: { line1: 'Długa 12' } }),
    ).toEqual({ target_point: 'KRA010' })
    expect(toInpostShippingData({ name: 'KRA010' })).toEqual({
      target_point: 'KRA010',
    })
  })

  it('reads the point back from the shipping data', () => {
    expect(getInpostPoint(toInpostShippingData(point))).toEqual(point)
    expect(getInpostPoint({ target_point: 'KRA010' })).toEqual({
      name: 'KRA010',
    })
  })

  it('returns null when the shipping data has no valid point', () => {
    expect(getInpostPoint(undefined)).toBeNull()
    expect(getInpostPoint(null)).toBeNull()
    expect(getInpostPoint({})).toBeNull()
    expect(getInpostPoint({ target_point: 42 })).toBeNull()
    expect(
      getInpostPoint({ target_point_details: { address: point.address } }),
    ).toBeNull()
  })
})
