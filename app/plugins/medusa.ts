import Medusa from '@medusajs/js-sdk'
import { buildBrowserMedusaConfig } from '~/utils/medusa'

// The page's Medusa client, `$medusa`, read through useMedusaClient()
// (app/composables/medusa.ts). Runs in the browser and in every server render
// (one client per render, as Nuxt creates one app per request), so the
// catalog and cart repositories call the same client on both sides.
export default defineNuxtPlugin({
  name: 'medusa',
  setup() {
    const { medusa } = useRuntimeConfig().public

    return {
      provide: { medusa: new Medusa(buildBrowserMedusaConfig(medusa)) },
    }
  },
})
