// Where the Medusa Store API is and the store's publishable key:
// `runtimeConfig.public.medusa`, set from NUXT_PUBLIC_MEDUSA_BACKEND_URL and
// NUXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (at build time and again at runtime).
// Both clients are built from it, the browser's (app/plugins/medusa.ts) and
// the server API routes' (server/utils/medusa.ts).
export type MedusaPublicConfig = {
  backendUrl: string
  publishableKey: string
}
