import type { StoreRegionListResponse } from '@medusajs/types'
import { getCountriesFromRegions } from '../app/utils/country'

export async function prerenderRoutesHook(ctx: { routes: Set<string> }) {
  const response = await fetch(
    `${process.env.NUXT_PUBLIC_MEDUSA_BACKEND_URL}/store/regions`,
    {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key':
          process.env.NUXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `Failed to fetch regions for prerendering: ${response.status} ${response.statusText}`,
    )
  }

  const { regions }: StoreRegionListResponse = await response.json()
  const countries = getCountriesFromRegions(regions)

  for (const country of countries) {
    ctx.routes.add(`/${country.iso_2}`)
  }
}
