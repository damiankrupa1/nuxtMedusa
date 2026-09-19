# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A headless e-commerce storefront ("Fashion Store") built with Nuxt 4 (compat v4, `future.compatibilityVersion: 4`) against a Medusa.js commerce backend. It is based on https://github.com/OlivierBelaud/nuxt-starter-medusa. Requires Node.js >= 22 and pnpm >= 9, plus a running Medusa backend.

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
```

There is no test suite/runner configured in this repo — CI (`.github/workflows/ci.yml`) only runs `pnpm lint` and `pnpm build` on push/PR to `main`.

### Environment

Copy `.env.template` to `.env` and set:
- `NUXT_PUBLIC_MEDUSA_BACKEND_URL` — Medusa backend base URL (default `http://localhost:9000`)
- `NUXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` — Medusa store publishable API key
- `NUXT_PUBLIC_STRIPE_KEY` — Stripe publishable key

### Git hooks (husky)

- `pre-commit` runs `pnpm lint` and blocks the commit on failure; `lint-staged` also runs `eslint --fix`/`prettier --write` on staged `*.{js,ts,vue}` and `prettier --write` on `*.{json,css,scss,md}`.
- `commit-msg` runs commitlint (`@commitlint/config-conventional` + `commitlint.config.js`). Commit subjects must use `type: description` with `type` restricted to `feat|fix|refactor|docs|style|test|build`, a non-empty subject, max 72 chars.

## Architecture

### Three-layer data access: repository → service → composable

Most Medusa Store API access flows through three layers under `app/`:

1. **Repository** (`app/repository/*.repository.ts`): thin data-access functions. `apiRepository()` wraps `useMedusaClient()` (from `@nuxtjs/medusa`) with a `request()` helper that logs and rethrows errors; the `product`, `category`, `collection`, `country`, `order`, `payment`, and `cart` repositories all call `apiRepository()` and issue `client.store.*` calls directly. `customer.repository.ts` is the exception: it calls the `server/api/customers/**` routes via `$fetch` (still funneled through `apiRepository()`'s `request()`) because auth needs the server-side cookie session.
2. **Service** (`app/services/*.service.ts`): composes repository calls and adds business logic. `cart.service.ts` and `customer.service.ts` carry real logic (cart-id lifecycle, region reconciliation, `refreshNuxtData` side effects) and are consumed by composables. `category.service.ts`, `collection.service.ts`, `order.service.ts`, `payment.service.ts`, and `product.service.ts` are currently thin pass-throughs with **no callers** — the composables for those domains call the repository directly instead. If you touch one of those domains, either wire the composable through its service (so the layer earns its keep) or remove the unused service — don't add a fourth pattern.
3. **Composable** (`app/composables/*.ts`): the Vue-facing layer. Wraps repository/service calls in `useLazyAsyncData`/`useLazyFetch` for reads (see cache-key convention below), or a `loading`/`data`/`mutate()` shape for writes.

**Server API routes** (`server/api/**`): Nitro/H3 handlers using `serverMedusaClient(event)` (from `#medusa/server`), wrapped in `defineWrappedResponseHandler` (`server/utils/handler.ts`), which catches thrown errors, extracts `MedusaError` `status`/`message`, and re-throws as an H3 error. Only `server/api/customers/**` (login/register/logout/me) is actually called from `app/` today, because it needs the server-side cookie session. `server/api/products`, `categories`, `collections`, and `regions` handlers still exist but are currently unreferenced from `app/` — the equivalent repositories call `client.store.*` straight from the client/SSR context instead. Treat those handlers as dead code / cleanup candidates, not the active path for those domains.

When adding a new Medusa-backed feature: put the client call in a repository, put any orchestration/business logic in a service, and expose it to components via a composable. Don't call `useMedusaClient()` or `$fetch` directly from a composable or component.

### Region/country routing

Every page lives under `app/pages/[countryCode]/...`; `app/pages/index.vue` is just a redirect target. `app/middleware/region.global.ts` runs on every navigation and:
- Resolves the country from the `country_code` cookie vs. the `countryCode` route param vs. `useAppConfig().defaultCountry`.
- Calls `useCountry().setCountry(...)` to sync `useState('country')` + the cookie.
- Redirects to `/${iso_2}/...` when the country in the URL doesn't match.

`useCountry()`/`useCountries()` (`app/composables/country.ts`) are the source of truth for the current region; most data-fetching composables key off `country.value.region_id`. `nuxt.config.ts` also has a `prerender:routes` hook that fetches all regions from Medusa at build time to seed prerendered country routes.

### Data-fetching conventions

- Read operations use `useLazyFetch`/`useLazyAsyncData` with explicit, colon-delimited cache keys that encode the params they depend on (e.g. `` `products:${collection_id}:${category_id}:${limit}:${offset}:${region_id}` `` , `` `product:${handle}:region:${region_id}` ``). When adding a new fetcher, follow this key convention so `refreshNuxtData`/payload lookups keep working.
- `useFetchProductByHandle` (`app/composables/product.ts`) has a `default()` that scans other cached `products:*` payload entries for a matching handle to avoid a network round-trip — be aware of this when changing product list cache keys.
- Cart/order/payment/customer mutation composables all follow the same shape: `loading` ref + `data` ref + async `mutate(...)`, and call `refreshNuxtData('cart')` / `refreshNuxtData('customer')` after any mutating call (done inside the service, e.g. `cart.service.ts`, `customer.service.ts`).
- Cart identity is a `cart_id` cookie managed by `useUserCart()` (90-day maxAge), not Medusa session state.

### `routeRules` / rendering

`nuxt.config.ts` forces SSR (`{ ssr: true }`) for `/**/products/**`, `/**/collections/**`, `/**/categories/**`, `/**/account`, `/**/store`, `/**/cart`, `/**/checkout` — keep new commerce-critical routes consistent with this if they need SEO/SSR.

### Directory layout

- `app/pages` — file-based routes, all nested under `[countryCode]`.
- `app/components` — organized by domain (`cart`, `checkout`, `product`, `order`, `collection`, `store`, `auth`, `app`), with further subfolders for compound UI (e.g. `checkout/address`, `checkout/payment`, `cart/item`).
- `app/composables` — one file per domain (`cart`, `category`, `checkout`, `collection`, `country`, `customer`, `filters`, `order`, `payment`, `product`). These call into `app/services` and/or `app/repository` rather than Medusa directly (see above).
- `app/services` — `*.service.ts` business-logic layer between composables and repositories (cart, category, collection, customer, order, payment, product). See the repository → service → composable note above for which ones actually have callers.
- `app/repository` — `*.repository.ts` data-access layer; `api.repository.ts` provides the shared `useMedusaClient()` + error-handling wrapper the other repositories (product, category, collection, country, order, payment, cart, customer) build on.
- `app/utils` — pure helpers (`price`, `product`, `address`, `country`, `payment`, `percentage-diff`, `homepage`), auto-imported by Nuxt.
- `server/api` — Nitro route handlers for `products`, `categories`, `collections`, `customers`, `regions`; only `customers/**` is currently wired up to `app/` (see above).
- `server/utils/handler.ts` / `server/types/medusa-error.ts` — shared error-wrapping for API routes.

### Key modules (`nuxt.config.ts`)

`@nuxtjs/medusa` (Medusa SDK integration, `server: true`), `@nuxt/ui` (with `colorMode: false`), `@nuxt/image`, `@nuxt/eslint` (stylistic rules enabled). Stripe is integrated via `@stripe/stripe-js` using `runtimeConfig.public.stripeKey`. Note: `@nuxtjs/seo` is still a `package.json` dependency but is not currently registered in the `modules` array — don't assume it's active.
