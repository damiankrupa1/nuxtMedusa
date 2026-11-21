import type { StoreRegionListResponse } from '@medusajs/types'

export function countryRepository() {
  return {
    // Through server/api/regions, which caches Medusa's answer and checks it
    // (server/repository/medusa.repository.ts). Every answer of that route
    // was reported by the server already (a Medusa failure, a regions answer
    // that doesn't match its schema, once, or any other 5xx through Sentry's
    // Nitro hook), so only a request that got no answer (network, offline,
    // abort) is reported here, as fetchGlobal() does for Payload. Otherwise
    // a regions failure, which repeats on every server render until it is
    // fixed, would be reported once more per render.
    async listCountries(): Promise<StoreRegionListResponse> {
      try {
        return await $fetch<StoreRegionListResponse>('/api/regions')
      } catch (error) {
        if ((error as { statusCode?: number }).statusCode === undefined) {
          captureError(error, { source: 'medusa' })
        }
        throw error
      }
    },
  }
}
