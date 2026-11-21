import type { z } from 'zod'

// Where the Medusa Store API is and the store's publishable key:
// `runtimeConfig.public.medusa`, set from NUXT_PUBLIC_MEDUSA_BACKEND_URL and
// NUXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (at build time and again at runtime).
// Both clients are built from it, the browser's (app/plugins/medusa.ts) and
// the server API routes' (server/utils/medusa.ts).
export type MedusaPublicConfig = {
  backendUrl: string
  publishableKey: string
}

// What parseMedusaResponse() (app/utils/medusa-response.ts) does with a
// Medusa answer that doesn't match its schema:
// - `hard`: throws (session and payments: never go on with half of it)
// - `soft`: reports once and hands the caller an error for its existing
//   error state (data that is only displayed or routed on)
export const MEDUSA_RESPONSE_POLICY = { hard: 'hard', soft: 'soft' } as const

export type MedusaResponsePolicy =
  (typeof MEDUSA_RESPONSE_POLICY)[keyof typeof MEDUSA_RESPONSE_POLICY]

export type MedusaResponseResult<T> =
  { success: true; data: T } | { success: false; error: Error }

export type MedusaDeepPartial<T> = T extends (infer Item)[]
  ? MedusaDeepPartial<Item>[]
  : T extends object
    ? { [K in keyof T]?: MedusaDeepPartial<T[K]> }
    : T

/**
 * The fields a narrow schema of the Medusa type `T` (from `@medusajs/types`)
 * may list: only keys `T` has, each with a schema whose output `T` accepts.
 * Every object of such a schema is written as
 * `z.looseObject({ ... } satisfies MedusaResponseShape<T>)`, nested ones too,
 * so a schema can neither name a field Medusa's type doesn't have nor widen
 * one (`nullable()` on a field that is never `null`). Requiring a field the
 * type marks optional is allowed: that is the point of the schema.
 */
export type MedusaResponseShape<T> = {
  [K in keyof T]?: z.ZodType<MedusaDeepPartial<T[K]>>
}
