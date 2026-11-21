import Medusa from '@medusajs/js-sdk'
import type { Config } from '@medusajs/js-sdk'
import type { H3Event } from 'h3'
import type { MedusaPublicConfig } from '~/types/medusa'

declare module 'h3' {
  interface H3EventContext {
    // The request's Medusa client, see serverMedusaClient()
    medusa?: Medusa
  }
}

// The server client's config: the same backend and publishable key as the
// page's client (app/utils/medusa.ts), but JWT auth that stores nothing.
// - `type: 'jwt'`: with 'session' (the page client's type) the SDK's
//   auth.login() follows the token with `POST /auth/session`, a Medusa cookie
//   session this server never uses and nothing ends (#82).
// - `jwtTokenStorageMethod: 'nostore'`: the SDK keeps no token, so a login's
//   token never stays on the client, and it never touches localStorage
//   (with 'local' every call throws on the server, and auth.register()
//   rejects unhandled). Calls made as the customer pass the token themselves
//   (server/repository/customer.repository.ts).
export function buildServerMedusaConfig({
  backendUrl,
  publishableKey,
}: MedusaPublicConfig): Config {
  return {
    baseUrl: backendUrl,
    publishableKey,
    debug: false,
    auth: { type: 'jwt', jwtTokenStorageMethod: 'nostore' },
  }
}

// One client per request, kept on `event.context`, never one shared at module
// level: every caller of a request gets the same client, and nothing of one
// request (a token, should the config ever store one) reaches another's.
export function serverMedusaClient(event: H3Event): Medusa {
  event.context.medusa ??= new Medusa(
    buildServerMedusaConfig(useRuntimeConfig(event).public.medusa),
  )

  return event.context.medusa
}
