// Shared setup of the draft preview tests (#53). The handlers and plugins run
// on a real h3 app (the h3 version Nitro uses), so status codes, headers,
// router params and query parsing behave as in production; only Nitro's own
// auto-imports (useRuntimeConfig, useAppConfig, the cache, $fetch) are
// replaced. Tests importing this need `// @vitest-environment node`.
import type { App, EventHandler, H3Event } from 'h3'
import {
  createApp,
  createError,
  createRouter,
  defineEventHandler,
  getHeader,
  getQuery,
  getResponseHeader,
  getRouterParam,
  removeResponseHeader,
  sendRedirect,
  setResponseHeader,
  setResponseStatus,
  toWebHandler,
} from 'h3'
import { SignJWT } from 'jose'

import type { PreviewRuntimeConfigInput } from '~/types/preview'

// 36 characters, above PREVIEW_SECRET_MIN_LENGTH. Test-only, not a real one.
export const TEST_PREVIEW_SECRET = 'test-only-preview-secret-0123456789'
export const TEST_API_KEY = 'test-only-api-key'
export const PAYLOAD_URL = 'https://cms.example.com/'
export const MEDUSA_ADMIN = 'https://admin.example.com'

export const previewRuntimeConfig = (
  payloadPreview: PreviewRuntimeConfigInput['payloadPreview'] = {},
): PreviewRuntimeConfigInput => ({
  payloadPreview: {
    secret: TEST_PREVIEW_SECRET,
    apiKey: TEST_API_KEY,
    apiKeyCollection: 'service-users',
    frameAncestors: MEDUSA_ADMIN,
    ...payloadPreview,
  },
  public: { payloadUrl: PAYLOAD_URL },
})

export const nitro = {
  runtimeConfig: previewRuntimeConfig(),
}

/** Nitro's auto-imports, taken from h3 where Nitro takes them from h3. */
export function installNitroGlobals(extra: Record<string, unknown> = {}) {
  Object.assign(globalThis, {
    createError,
    defineEventHandler,
    defineNitroPlugin: (plugin: unknown) => plugin,
    getHeader,
    getQuery,
    getResponseHeader,
    getRouterParam,
    removeResponseHeader,
    sendRedirect,
    setResponseHeader,
    setResponseStatus,
    useAppConfig: () => ({ defaultCountry: 'pl' }),
    useRuntimeConfig: () => nitro.runtimeConfig,
    ...extra,
  })
}

type Hook = (...args: never[]) => unknown

/** Loads a Nitro plugin and returns the hooks it registered, by name. */
export async function loadPlugin(
  importPlugin: () => Promise<{ default: unknown }>,
): Promise<Record<string, Hook[]>> {
  const hooks: Record<string, Hook[]> = {}
  const plugin = (await importPlugin()).default as (nitroApp: unknown) => void
  plugin({
    hooks: {
      hook: (name: string, handler: Hook) => {
        ;(hooks[name] ??= []).push(handler)
      },
    },
  })
  return hooks
}

/** Calls the hooks registered under `name`, plugin by plugin, in order. */
export function runHooks(
  pluginHooks: Record<string, Hook[]>[],
  name: string,
  ...args: unknown[]
) {
  pluginHooks
    .flatMap((hooks) => hooks[name] ?? [])
    .forEach((hook) => (hook as (...a: unknown[]) => unknown)(...args))
}

export interface TestRoutes {
  get?: Record<string, EventHandler>
  post?: Record<string, EventHandler>
}

/**
 * An h3 app with the given routes. The `request` and `beforeResponse` hooks
 * of the plugins are wired to h3's onRequest/onBeforeResponse, as Nitro does.
 * `regions` stands in for event.$fetch('/api/regions').
 */
export function createTestApp(
  routes: TestRoutes,
  {
    pluginHooks = [] as Record<string, Hook[]>[],
    regions = async () => ({ regions: [] as unknown[] }),
  } = {},
) {
  const run = (name: string, ...args: unknown[]) =>
    runHooks(pluginHooks, name, ...args)

  const app: App = createApp({
    onRequest: (event: H3Event) => {
      Object.assign(event, { $fetch: regions })
      run('request', event)
    },
    onBeforeResponse: (event: H3Event, response: unknown) =>
      run('beforeResponse', event, response),
  })
  const router = createRouter()
  Object.entries(routes.get ?? {}).forEach(([path, handler]) =>
    router.get(path, handler),
  )
  Object.entries(routes.post ?? {}).forEach(([path, handler]) =>
    router.post(path, handler),
  )
  app.use(router)

  const handle = toWebHandler(app)
  return (path: string, init?: RequestInit) =>
    handle(new Request(`https://shop.example.com${path}`, init))
}

export interface MintOptions {
  secret?: string
  issuer?: string
  audience?: string
  subject?: string
  global?: string
  locale?: string
  // Seconds since epoch; default now
  issuedAt?: number
  lifetime?: number
}

/**
 * A preview token minted the way Payload does it (payload-cms/src/preview/
 * previewUrl.ts in simple-landing-page-nuxt): jose's SignJWT, HS256,
 * `iss: payload-cms`, `aud: storefront-preview`, `sub`, `global`, `locale`,
 * valid for two hours from `iat`.
 */
export function mintPreviewToken({
  secret = TEST_PREVIEW_SECRET,
  issuer = 'payload-cms',
  audience = 'storefront-preview',
  subject = '1',
  global = 'navigation',
  locale = 'pl',
  issuedAt = Math.floor(Date.now() / 1000),
  lifetime = 2 * 60 * 60,
}: MintOptions = {}) {
  return new SignJWT({ global, locale })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(subject)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + lifetime)
    .sign(new TextEncoder().encode(secret))
}
