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

### Two Medusa access paths

There are two distinct ways this app talks to Medusa — know which one to use:

1. **Server API routes** (`server/api/**`): Nitro/H3 handlers that proxy to Medusa via `serverMedusaClient(event)` (from `#medusa/server`, provided by `@nuxtjs/medusa`). Every handler is wrapped in `defineWrappedResponseHandler` (`server/utils/handler.ts`), which catches thrown errors, extracts `MedusaError` `status`/`message`, and re-throws as an H3 error — so route handlers can just `throw` or let Medusa client errors propagate. Used for anything needing cookies/auth (customer login/register/logout/me) or where a server-side cache/response shape is desired (products, categories, collections, regions).
2. **Direct client calls from composables**: `useMedusaClient()` (from `@nuxtjs/medusa`) is called directly inside composables for cart/order/payment/fulfillment operations (see `app/composables/data.ts`, `app/composables/cart.ts`). These call the Medusa Store API straight from the client/SSR context rather than going through `server/api`.

When adding a new Medusa-backed feature, follow the existing pattern for that domain rather than inventing a third approach.

### Region/country routing

Every page lives under `app/pages/[countryCode]/...`; `app/pages/index.vue` is just a redirect target. `app/middleware/region.global.ts` runs on every navigation and:
- Resolves the country from the `country_code` cookie vs. the `countryCode` route param vs. `useAppConfig().defaultCountry`.
- Calls `useCountry().setCountry(...)` to sync `useState('country')` + the cookie.
- Redirects to `/${iso_2}/...` when the country in the URL doesn't match.

`useCountry()`/`useCountries()` (`app/composables/country.ts`) are the source of truth for the current region; most data-fetching composables key off `country.value.region_id`. `nuxt.config.ts` also has a `prerender:routes` hook that fetches all regions from Medusa at build time to seed prerendered country routes.

### Data-fetching conventions (`app/composables/data.ts`)

- Read operations use `useLazyFetch`/`useLazyAsyncData` with explicit, colon-delimited cache keys that encode the params they depend on (e.g. `` `products:${collection_id}:${category_id}:${limit}:${offset}:${region_id}` `` , `` `product:${handle}:region:${region_id}` ``). When adding a new fetcher, follow this key convention so `refreshNuxtData`/payload lookups keep working.
- `useFetchProductByHandle` has a `default()` that scans other cached `products:*` payload entries for a matching handle to avoid a network round-trip — be aware of this when changing product list cache keys.
- Cart/order/payment mutation composables (`app/composables/cart.ts`) all follow the same shape: `loading` ref + `data` ref + async `mutate(...)`, and call `refreshNuxtData('cart')` after any cart-mutating Medusa call.
- Cart identity is a `cart_id` cookie managed by `useUserCart()` (90-day maxAge), not Medusa session state.

### `routeRules` / rendering

`nuxt.config.ts` forces SSR (`{ ssr: true }`) for `/**/products/**`, `/**/collections/**`, `/**/categories/**`, `/**/account`, `/**/store`, `/**/cart`, `/**/checkout` — keep new commerce-critical routes consistent with this if they need SEO/SSR.

### Directory layout

- `app/pages` — file-based routes, all nested under `[countryCode]`.
- `app/components` — organized by domain (`cart`, `checkout`, `product`, `order`, `collection`, `store`, `auth`, `app`), with further subfolders for compound UI (e.g. `checkout/address`, `checkout/payment`, `cart/item`).
- `app/composables` — one file per domain (`cart`, `checkout`, `country`, `customer`, `data`, `filters`, `payment`).
- `app/utils` — pure helpers (`price`, `product`, `address`, `country`, `payment`, `percentage-diff`, `homepage`), auto-imported by Nuxt.
- `server/api` — Nitro route handlers, mirroring the Medusa Store API domains in use (`products`, `categories`, `collections`, `customers`, `regions`).
- `server/utils/handler.ts` / `server/types/medusa-error.ts` — shared error-wrapping for API routes.

### Key modules (`nuxt.config.ts`)

`@nuxtjs/medusa` (Medusa SDK integration, `server: true`), `@nuxt/ui` (with `colorMode: false`), `@nuxt/image`, `@nuxt/eslint` (stylistic rules enabled), `@nuxtjs/seo`. Stripe is integrated via `@stripe/stripe-js` using `runtimeConfig.public.stripeKey`.
