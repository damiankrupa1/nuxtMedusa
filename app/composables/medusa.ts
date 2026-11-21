import type Medusa from '@medusajs/js-sdk'

// The page's Medusa client, provided by app/plugins/medusa.ts. Only
// repositories use it (apiRepository(), and today useFetchShippingOptions());
// a component or another composable goes through them.
export const useMedusaClient = (): Medusa => useNuxtApp().$medusa
