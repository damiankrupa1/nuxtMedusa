# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A headless e-commerce storefront ("Fashion Store") built with Nuxt 3.16 in Nuxt 4 compatibility mode (`future.compatibilityVersion: 4`) against a Medusa.js commerce backend. It is based on https://github.com/OlivierBelaud/nuxt-starter-medusa. Requires Node.js >= 22 and pnpm >= 9, plus a running Medusa backend.

## Commands

```bash
pnpm install       # install deps (postinstall runs `nuxt prepare`)
pnpm dev           # start dev server
pnpm build         # production build
pnpm generate      # static generation
pnpm preview       # preview a production build
pnpm lint          # eslint .
pnpm lint:fix      # eslint . --fix
pnpm format        # prettier --write .
pnpm format:check  # prettier --check .
pnpm test          # jest --runInBand
```

The Jest unit tests live under `tests/unit/` and are run by CI together with `pnpm lint` and `pnpm build` on pushes to `main` and pull requests. Run one test file with `pnpm exec jest tests/unit/utils/product.test.ts --runInBand`.

### Environment

Copy `.env.template` to `.env` and set:

- `NUXT_PUBLIC_MEDUSA_BACKEND_URL` — Medusa backend base URL (default `http://localhost:9000`)
- `NUXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` — Medusa store publishable API key
- `NUXT_PUBLIC_STRIPE_KEY` — Stripe publishable key
- `NUXT_PUBLIC_INPOST_GEOWIDGET_TOKEN` — InPost Geowidget token for the parcel locker picker in the delivery step
- `NUXT_PUBLIC_PAYLOAD_URL` — Payload CMS base URL (editorial/marketing content; see Payload CMS integration below). Optional — header nav and footer fall back to static i18n content when unset or unreachable.

### Git hooks (husky)

- `pre-commit` runs `pnpm lint` and blocks the commit on failure; `lint-staged` also runs `eslint --fix`/`prettier --write` on staged `*.{js,ts,vue}` and `prettier --write` on `*.{json,css,scss,md}`.
- `commit-msg` runs commitlint (`@commitlint/config-conventional` + `commitlint.config.js`). Commit subjects must use `type: description` with `type` restricted to `feat|fix|refactor|docs|style|test|build`, a non-empty subject, max 72 chars.

## Architecture

### Three-layer data access: repository → service → composable

Most Medusa Store API access flows through three layers under `app/`:

1. **Repository** (`app/repository/*.repository.ts`): thin data-access functions. `apiRepository()` wraps `useMedusaClient()` (from `@nuxtjs/medusa`) with a `request()` helper that reports (`captureError`) and rethrows errors; the `product`, `category`, `collection`, `order`, `payment`, and `cart` repositories all call `apiRepository()` and issue `client.store.*` calls directly. `customer.repository.ts` and `country.repository.ts` are the exceptions: they call `server/api/customers/**` and `server/api/regions` via `$fetch` (still funneled through `apiRepository()`'s `request()`), because auth needs the server-side cookie session and regions are cached on the server. `stripe.repository.ts` wraps Stripe.js instead of Medusa (lazy `loadStripe`, card element, card/BLIK/Przelewy24 confirmations, PaymentIntent lookup) and turns Stripe's `{ error }` results into thrown errors, reporting all but the customer-side ones (`card_error`, `validation_error`).
2. **Service** (`app/services/*.service.ts`): composes repository calls and adds business logic. `cart.service.ts`, `customer.service.ts` and `payment.service.ts` carry real logic (cart-id lifecycle, region reconciliation, `refreshNuxtData` side effects; for payment, picking the Stripe confirmation by provider and checking the payment Przelewy24 redirected back from) and are consumed by composables. `category.service.ts`, `collection.service.ts`, `order.service.ts`, and `product.service.ts` are currently thin pass-throughs with **no callers** — the composables for those domains call the repository directly instead. If you touch one of those domains, either wire the composable through its service (so the layer earns its keep) or remove the unused service — don't add a fourth pattern.
3. **Composable** (`app/composables/*.ts`): the Vue-facing layer. Wraps repository/service calls in `useLazyAsyncData`/`useLazyFetch` for reads (see cache-key convention below), or a `loading`/`data`/`mutate()` shape for writes.

**Server API routes** (`server/api/**`): Nitro/H3 handlers using `serverMedusaClient(event)` (from `#medusa/server`), wrapped in `defineWrappedResponseHandler` (`server/utils/handler.ts`), which catches thrown errors, extracts `MedusaError` `status`/`message`, and re-throws as an H3 error. Only `server/api/customers/**` (login/register/logout/me, for the server-side cookie session) and `server/api/regions` (a `defineCachedEventHandler`, since the region middleware needs regions on every server render) are called from `app/` today. `server/api/products`, `categories`, and `collections` handlers still exist but are currently unreferenced from `app/` — the equivalent repositories call `client.store.*` straight from the client/SSR context instead. Treat those handlers as dead code / cleanup candidates, not the active path for those domains.

When adding a new Medusa-backed feature: put the client call in a repository, put any orchestration/business logic in a service, and expose it to components via a composable. Don't call `useMedusaClient()` or `$fetch` directly from a composable or component.

### Region/country routing

Every page lives under `app/pages/[countryCode]/...`; `app/pages/index.vue` is just a redirect target. `app/middleware/region.global.ts` runs on every navigation (on the server, and in the browser during hydration and client-side navigation) and:

- Takes the country from the `countryCode` route param when it's a known region. The URL alone decides, never the cookie, so a server-rendered page is the same for every visitor (see `routeRules` / rendering).
- Otherwise redirects to `/${iso_2}${fullPath}`, using the `country_code` cookie's country if it's still a region, else `useAppConfig().defaultCountry`.
- Calls `useCountry().setCountry(...)` to sync `useState('country')` and the i18n locale. The `country_code` cookie is only written in the browser, so SSR responses never carry `Set-Cookie`.

`useCountry()`/`useCountries()` (`app/composables/country.ts`) are the source of truth for the current region; most data-fetching composables key off `country.value.region_id`.

### Data-fetching conventions

- Read operations use `useLazyFetch`/`useLazyAsyncData` with explicit, colon-delimited cache keys that encode the params they depend on (e.g. `` `products:${collection_id}:${category_id}:${limit}:${offset}:${region_id}` `` , `` `product:${handle}:region:${region_id}` ``). When adding a new fetcher, follow this key convention so `refreshNuxtData`/payload lookups keep working.
- By-handle repository lookups (product, category, collection) return `null` when nothing matches; their pages call `useNotFoundWhenMissing(data, status, message)` (`app/composables/not-found.ts`) so a missing handle answers a real 404 instead of an empty page, on the server and after client-side navigation.
- `useFetchProductByHandle` (`app/composables/product.ts`) has a `default()` that scans other cached `products:*` payload entries for a matching handle to avoid a network round-trip — be aware of this when changing product list cache keys.
- Cart/order/payment/customer mutation composables all follow the same shape: `loading` ref + `data` ref + async `mutate(...)`, and call `refreshNuxtData('cart')` / `refreshNuxtData('customer')` after any mutating call (done inside the service, e.g. `cart.service.ts`, `customer.service.ts`).
- Cart identity is a `cart_id` cookie managed by `useUserCart()` (90-day maxAge), not Medusa session state. Carts are created on the first add to cart (`updateOrCreateLineItem`); `useFetchCart()` only retrieves one and returns `{ cart: null }` before that, so treat `null` as an empty cart and `undefined` as still loading.

### Error reporting

Errors are reported once, where they come from an external system, through `captureError()` (`app/utils/capture-error.ts`): `apiRepository()`'s `request()`, `stripeRepository()`, the InPost Geowidget loader, and Medusa's `type: 'cart'` answer in `usePlaceOrder()`. It only logs to the console until error monitoring (Sentry) is plugged in there. Composables and components don't log errors; they only turn them into UI state. Don't name it `reportError` — that's a browser global.

### Payload CMS integration

Editorial/marketing content with no commerce meaning — the header's `primaryNav`, the footer's help/world/legal links and contact/social details, and most of the home page (campaign hero, brands row, studio story, journal, and the Medusa-backed category-tiles/shop-the-look sections below), see `.claude/skills/missing-cms-content/SKILL.md` for what's left — is served by a separate Payload CMS instance via `app/repository/cms.repository.ts` → `app/composables/cms.ts`, following the same repository → composable shape as the rest of the app. Medusa remains the only source of truth for products/prices/stock/cart/orders; Payload never duplicates that data. Two sections (`CategoryTiles`, `ShopTheLook`) curate real catalog items by handle, so they go through `app/services/cms.service.ts` instead of straight from the composable to the repository — composing a Payload fetch with a Medusa category/product-by-handle lookup is exactly the "business logic between repositories" the service layer exists for (see the repository → service → composable note above). Every other CMS fetcher has no such cross-domain logic and skips the service layer, same as `category`/`collection`.

- Payload's `Navigation`/`FooterContent` globals are public read-only today, so `cms.repository.ts`'s `fetchGlobal()` calls Payload's REST API directly via `$fetch` using `runtimeConfig.public.payloadUrl` (env `NUXT_PUBLIC_PAYLOAD_URL`) — no admin/API key involved. If Payload ever needs a key or a draft-preview secret, that must move server-side (a `server/api/cms/**` proxy, private runtimeConfig) instead of `public`; only `fetchGlobal()`'s request target would change, not its callers.
- A Payload outage or an unconfigured URL must never break a page: `fetchGlobal()` catches, reports via `captureError({ source: 'payload', ... })`, and returns `null`. Components treat `null` as "render the static i18n fallback" (see `category-nav.vue`, `footer/menu/help.vue`, `footer/menu/world.vue`, `footer/menu/brand.vue`, `footer/copyright.vue`) rather than erroring or showing an empty section.
- Cache keys follow the existing convention: `` `cms:navigation:${locale}` ``, `` `cms:footer:${locale}` ``.

### `routeRules` / rendering

`nuxt.config.ts` forces SSR (`{ ssr: true }`) for `/**/products/**`, `/**/collections/**`, `/**/categories/**`, `/**/account`, `/**/store`, `/**/cart`, `/**/checkout` — keep new commerce-critical routes consistent with this if they need SEO/SSR.

Catalog pages (the `/[countryCode]` home, `store`, `products/[handle]`, `categories/[handle]`, `collections/[handle]`) opt into the CDN cache with `definePageMeta({ cdnCache: true })`. `app/plugins/cdn-cache.server.ts` marks such requests and `server/plugins/cdn-cache.ts` adds `CDN-Cache-Control: max-age=60, stale-while-revalidate=300`, but only to `200` responses without `Set-Cookie`, so redirects, errors and personalised responses are never shared. A page that opts in must render the same for every visitor on the server: no cookie reads or writes during SSR, and anything per-visitor (cart, account state) stays client-only (`<ClientOnly>`). Don't opt in cart, checkout, account or order pages.

- Don't prerender catalog pages instead: that froze product data (`_payload.json`) at build time, so catalog changes in Medusa only showed up after a storefront redeploy.
- Don't use `isr`/`swr` route rules for them either: Nitro's Vercel ISR only handles literal path prefixes (ours start with a dynamic country code) and doesn't pass the query string (`page`, `sortBy`) to the render.

### Directory layout

- Imports use root aliases, never relative paths: `~/` for `app/` (also from `tests/`), `~~/` for the project root (e.g. `~~/server/...`). ESLint enforces it (`no-restricted-imports` in `eslint.config.mjs`, for `app/`, `server/`, `tests/`; dynamic `import()` is not checked). Details: `.claude/skills/nuxt-vue-architecture/SKILL.md` -> `## Imports`.
- `app/pages` — file-based routes, all nested under `[countryCode]`.
- `app/components` — organized by domain (`cart`, `checkout`, `product`, `order`, `collection`, `store`, `auth`, `app`), with further subfolders for compound UI (e.g. `checkout/address`, `checkout/payment`, `cart/item`).
- `app/composables` — one file per domain (`cart`, `category`, `checkout`, `cms`, `collection`, `country`, `customer`, `filters`, `order`, `payment`, `product`), plus `not-found` shared by the by-handle pages. These call into `app/services` and/or `app/repository` rather than Medusa directly (see above).
- `app/services` — `*.service.ts` business-logic layer between composables and repositories (cart, category, cms, collection, customer, order, payment, product). See the repository → service → composable note above for which ones actually have callers.
- `app/repository` — `*.repository.ts` data-access layer; `api.repository.ts` provides the shared `useMedusaClient()` + error-handling wrapper the other repositories (product, category, collection, country, order, payment, cart, customer) build on; `stripe.repository.ts` is the Stripe.js counterpart; `cms.repository.ts` is the Payload counterpart (see Payload CMS integration above) — it calls Payload's REST API directly, not through `apiRepository()`, since that wrapper is Medusa-specific.
- `app/utils` — pure helpers (`price`, `product`, `address`, `country`, `payment`, `percentage-diff`, `homepage`), auto-imported by Nuxt, plus `capture-error` (see Error reporting).
- `server/api` — Nitro route handlers for `products`, `categories`, `collections`, `customers`, `regions`; only `customers/**` and `regions` are currently wired up to `app/` (see above).
- `server/utils/handler.ts` / `server/types/medusa-error.ts` — shared error-wrapping for API routes.

### Key modules (`nuxt.config.ts`)

`@nuxtjs/medusa` (Medusa SDK integration, `server: true`), `@nuxt/ui` (with `colorMode: false`), `@nuxt/image`, `@nuxt/eslint` (stylistic rules enabled). Stripe is integrated via `@stripe/stripe-js` using `runtimeConfig.public.stripeKey`, only through `stripe.repository.ts`; the review step's payment flow (card, BLIK, Przelewy24 redirect and return) lives in `useCartPayment()` (`app/composables/payment.ts`). `@nuxt/icon` (installed by Nuxt UI) puts only the `lucide` and `flag` collections into the server function; every other icon must appear as a literal name in the source so the client-bundle scan picks it up. An icon name built at runtime from another collection won't render unless that collection is added to `icon.serverBundle.collections`. Don't enable `i18n.bundle.dropMessageCompiler`: with it every server render fails with `unhandled node type: 0`.
