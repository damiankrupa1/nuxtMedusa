---
name: missing-medusa-api-data
description: 'Tracks commerce data the Fashion home page design needs that the current Medusa Store API/composables do not provide. Use when deciding whether to extend a repository/composable or keep mocking a field, and when wiring up a real backend for one of these gaps later.'
---

# Missing Medusa API data

Gaps between the Figma home page design and what `app/repository/*` + `app/composables/*` currently expose from the Medusa Store API. Each entry: what the UI needs, what's mocked today and where, what a real fix would require. Do not add new repository fields/queries to close these gaps without the user's go-ahead — these are intentionally mocked for now.

Entries are added as each home page section is implemented. Each entry notes how it was checked: most are based on `@medusajs/types` schema/type declarations and this repo's repository/composable code (reliable for "is there a field on this model at all" questions, e.g. `StoreProductCategory` truly has no image field in Medusa v2 core). Where that's not conclusive, or the question is "does the connected backend actually return X", verify live against the project's connected Medusa backend (see `storefront-env-is-production` memory for read-only access) instead of guessing from types, and mark the entry "Verified live" with the date.

## Header: "Ostatnie sztuki" (last pieces) nav item

- **Needs**: a nav entry that filters products running low on stock.
- **Mocked today**: `app/utils/navigation.ts` points it at `/store` like every other nav item, no filtering applied.
- **Real fix would need**: `useFetchProducts` / `product.repository.ts` already request `+variants.inventory_quantity`, so the raw data exists per-variant, but there's no aggregate "low stock" query or sort option exposed by `app/composables/product.ts` or `app/types/filter.ts` (`SORT_OPTIONS`) to build a dedicated low-stock listing from.

## Header: wishlist / saved products

- **Needs**: the heart icon in the main header should open a saved-products / wishlist view.
- **Mocked today**: `app/components/app/header/index.vue` links the heart icon to `/account` as a placeholder, no save/list behavior.
- **Real fix would need**: Medusa's Store API has no wishlist/saved-products concept, and no composable/repository/server route for it exists anywhere in this codebase — would need a new backend concept (e.g. a Medusa module) plus a new repository/composable layer.

## Header: country/currency display in the announcement bar

- **Needs**: Figma shows "Polska / PLN ↓" — country name plus its currency code.
- **Mocked today**: shown in `app/components/app/header/announcement-bar.vue` and `app/components/app/footer/copyright.vue` via the shared `getMockCurrencyCode()` helper (`app/utils/currency.ts`), a small static `iso_2 → currency` map, since `BaseRegionCountryWithRegionId` (`app/utils/country.ts`) carries no currency field.
- **Verified live** (2026-10-24, against the project's connected Medusa backend — see `storefront-env-is-production` memory): temporarily added `currency_code` to the `fields` param of `server/api/regions/index.get.ts`'s `medusa.store.region.list(...)` call and re-fetched `/api/regions` after a full dev-server restart (to rule out the route's 10-minute cache). The field **did not appear** in either region object — not just unrequested-and-therefore-missing (the original hypothesis), but absent from the response even when explicitly requested. Change was reverted after the check; nothing shipped from it.
- **Real fix would need**: investigation on the backend side (is `currency_code` actually populated on these two regions in this Medusa instance at all, or is the Store API behaving differently than `@medusajs/types`' `StoreRegion` type suggests in this Medusa version) before `country.repository.ts` / `useFetchCountries()` can be changed to surface it — don't assume adding the field to a `fields` param is sufficient, that was tried and didn't work.

## Footer: gift cards

- **Needs**: a "Gift cards" link in the shopping column.
- **Mocked today**: `app/components/app/footer/menu/categories.vue` links it to `/store`.
- **Real fix would need**: a gift card feature/module — not installed in this Medusa backend as far as the storefront code shows.

## Footer: payment & delivery provider badges

- **Needs**: Figma shows BLIK/VISA/Mastercard/PayPo/Przelewy24 and InPost/DPD as trust badges.
- **Mocked today**: `app/components/app/footer/payment-delivery.vue`, two static string arrays.
- **Real fix would need**: `stripe.repository.ts` only wires card/BLIK/Przelewy24 confirmation flows, not a "list enabled payment methods" query; InPost is only wired for the checkout parcel-locker picker. No composable exposes either as a list to render generically.
