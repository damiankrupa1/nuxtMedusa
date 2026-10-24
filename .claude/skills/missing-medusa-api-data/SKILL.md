---
name: missing-medusa-api-data
description: 'Tracks commerce data the Fashion home page design needs that the current Medusa Store API/composables do not provide. Use when deciding whether to extend a repository/composable or keep mocking a field, and when wiring up a real backend for one of these gaps later.'
---

# Missing Medusa API data

Gaps between the Figma home page design and what `app/repository/*` + `app/composables/*` currently expose from the Medusa Store API. Each entry: what the UI needs, what's mocked today and where, what a real fix would require. Do not add new repository fields/queries to close these gaps without the user's go-ahead — these are intentionally mocked for now.

Entries are added as each home page section is implemented.

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
- **Mocked today**: `app/components/app/header/announcement-bar.vue` shows `country.display_name` (real, from `useCountry()`) but the currency code comes from a small static `iso_2 → currency` map in the same file, since `BaseRegionCountryWithRegionId` (`app/utils/country.ts`) carries no currency field.
- **Real fix would need**: `country.repository.ts` / `useFetchCountries()` would need to surface each region's `currency_code` (Medusa regions do have one) alongside the country list.
