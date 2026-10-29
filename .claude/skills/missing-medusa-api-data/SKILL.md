---
name: missing-medusa-api-data
description: 'Tracks commerce data the Fashion home page design needs that the current Medusa Store API/composables do not provide. Use when deciding whether to extend a repository/composable or keep mocking a field, and when wiring up a real backend for one of these gaps later.'
---

# Missing Medusa API data

Gaps between the Figma home page design and what `app/repository/*` + `app/composables/*` currently expose from the Medusa Store API. Each entry: what the UI needs, what's mocked today and where, what a real fix would require. Do not add new repository fields/queries to close these gaps without the user's go-ahead — these are intentionally mocked for now.

Entries are added as each home page section is implemented. Each entry notes how it was checked: most are based on `@medusajs/types` schema/type declarations and this repo's repository/composable code (reliable for "is there a field on this model at all" questions, e.g. `StoreProductCategory` truly has no image field in Medusa v2 core). Where that's not conclusive, or the question is "does the connected backend actually return X", verify live against the project's connected Medusa backend (see `storefront-env-is-production` memory for read-only access) instead of guessing from types, and mark the entry "Verified live" with the date.

## Header: "Ostatnie sztuki" (last pieces) nav item

- **Needs**: a nav entry that filters products running low on stock.
- **Mocked today**: the nav entry comes from Payload's `Navigation` global (label + URL); the storefront applies no filtering to whatever URL the editor sets.
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
- **Verified live** (2026-10-24, against `medusaDemo/apps/backend/medusa-config.ts` — the actual backend this storefront's `.env` points at; see `storefront-env-is-production` memory): the `[Modules.PAYMENT]` config lists exactly **one** provider, `@medusajs/medusa/payment-stripe` (id `stripe`) — BLIK/Przelewy24 are payment method types handled _inside_ Stripe's own confirmation flow (matches `stripe.repository.ts`), not separate Medusa-level providers a generic "list payment providers" call could enumerate; VISA/Mastercard are card networks, not providers at all. **PayPo is not configured anywhere in this backend.** The `[Modules.FULFILLMENT]` config lists `inpost` (real — same integration as the checkout parcel-locker picker) and `manual` (generic fallback). **DPD is not configured anywhere in this backend.**
- **Real fix would need**: for payment, a composable wired to Medusa's `payment-providers` listing would today return only `["stripe"]` — not the five-badge breakdown — so matching the Figma design needs either badges driven by what Stripe itself has enabled (not a Medusa concept) or accepting the mismatch; PayPo needs a real provider added to `medusa-config.ts` first. For delivery, same story — DPD needs a real fulfillment provider added before it can be anything but a static label.

## Home: "New arrivals" card badge, brand line and material/color text

- **Needs**: Figma shows a per-product badge ("NOWOŚĆ"/"DOBRA BAZA", varies by item), a brand name line above the title, and a material/color text line below it.
- **Verified live** (2026-10-24, against the connected backend): temporarily broadened `product.repository.ts`'s `listProducts` `fields` to `+material,+collection.title` and inspected 4 real products — `product.material` was `null` on every one (field exists on `StoreProduct` but isn't populated in this catalog), and Medusa has no brand/manufacturer field at all. `collection.title` _is_ populated (e.g. "Wybór tygodnia", "Nowości") but isn't a brand and wasn't used. Change was reverted (not shipped) except for the separate, intentional `*options,*options.values` addition described below.
- **Correction — verified live again** (2026-10-24, product list view work, larger sample): `material` is _not_ null on every product — on `/store`'s first page (12 products) about a third had a real value (e.g. "100% akryl", "100% bawełna", "92% bawełna, 6% poliester, 2% elastan"), the rest null. So it's sparse, not absent. `product.repository.ts` now requests `+material` for real (see the product list entry below) and `ProductCard` renders it conditionally (`v-if="product?.material"`), same pattern as color swatches — the "4 products, all null" finding above was just a small, unlucky sample, not a schema gap. Brand remains genuinely absent (no field on `StoreProduct` at all), unlike material.
- **Mocked today**: `app/components/home/new-arrivals.vue` passes one uniform `badge` (`pages.home.newArrivals.badge`, "Nowość") to every card in the section via `ProductCard`'s new `badge` prop — defensible since the whole section is sorted newest-first, but it can't reproduce Figma's per-item variety. Brand line is omitted entirely (not faked) since the data doesn't exist at all. Material line now renders when present (see correction above).
- **Real fix would need**: a brand/manufacturer concept added to the backend (new module or a `metadata` convention) before per-product brand attribution is possible anywhere in the storefront. Material needs no further work — it renders for real today, just not on every product.

## Home: "New arrivals" color swatches

- **Needs**: color dots per product card.
- **Verified live** (2026-10-24): same diagnostic as above — some products (not all) have a real Medusa "Color" product option with plain-text values (e.g. "Black", "White"); no hex/swatch data, confirmed by `@medusajs/types`' `StoreProductOptionValue` shape (just `value: string`).
- **Shipped for real** (not mocked data, mocked _rendering_ only): `product.repository.ts`'s `listProducts` now requests `*options,*options.values` — a genuine, permanent fields addition (not reverted), since this data is real and the plan anticipated it. `ProductCard` finds an option whose title matches `/colou?r|kolor/i` and renders a dot per value via `getSwatchColor()` (`app/utils/color.ts`), a small color-name → hex map, omitting the row entirely for products with no color option.
- **Real fix would need**: nothing further for swatches to work generically — the name → hex map only needs to grow as new color option values show up in the catalog that aren't already covered.

## Home: "New arrivals" — "Fashion Studio" tab

- **Needs**: a third department tab alongside "Dla niej"/"Dla niego".
- **Mocked today**: `app/components/home/new-arrivals.vue` has no category/collection mapping for this tab — falls back to `category_id: undefined`, i.e. the newest products overall, same as no filter.
- **Real fix would need**: a "Fashion Studio" product line (category or collection) in the catalog — doesn't exist today (full category list verified live 2026-10-24: shirts, sweatshirts, pants, merch, dresses, jackets-coats, sportswear, accessories, women, men, t-shirts-tops, sweaters-cardigans, skirts).

## Home: "Shop the look" — buy the whole set

- **Needs**: a single "Shop this set" action that adds all 3 looked-up products (with a size per item) to the cart at once.
- **Mocked today**: `app/components/home/shop-the-look.vue`'s CTA just links to the first product's page — no multi-item add-to-cart happens.
- **Real fix would need**: `useAddToCart`/`cart.service.ts` only take one line item at a time; a "buy the set" action would need either a loop of individual add calls (still needs a size picked per item first, which the UI doesn't collect here) or a true bulk-add endpoint — plus a size-selection UI this component doesn't have.

## Newsletter signup (home and product list pages)

- **Needs**: a working email signup form (with interest checkboxes and marketing consent) that actually subscribes the visitor.
- **Mocked today**: `app/components/app/newsletter.vue` (`AppNewsletter`, rendered by `app/layouts/default.vue` on pages with `definePageMeta({ prefooter: true })`: home, search, store, category, collection) validates the email format and that consent is checked client-side via the `zod` schema in `app/types/newsletter.ts`, then just shows a local "thanks for signing up" success state — no request is sent anywhere. The validated `event.data` in `onSubmit` already carries `email`, `interests` (`women`/`men`) and `consent`, ready to send. No newsletter/ESP (email service provider) integration, composable, repository, or server route exists anywhere in this codebase.
- **Not remembered**: nothing records that a visitor signed up. The "thanks" state lives only in the layout's component instance, so the form shows again after a reload or after passing through a page without `prefooter`.
- **Real fix would need**: a real newsletter provider (Klaviyo, Mailchimp, a Medusa customer-group/marketing-consent field, etc.) and a server route or repository to call it from. If "already signed up" should be remembered, do it client-side only (cookie/`localStorage` read inside `<ClientOnly>`): the pages showing the newsletter are CDN-cached and must render the same for every visitor on the server.

## Product list (store/category/collection): filter bar facets

- **Needs**: Figma's "Search results" layout (node 12:1622, Fashion file) shows a filter bar with 7 facets — Dla kogo (for whom/gender), Kategoria, Rozmiar, Kolor, Materiał, Cena, Marka — plus active-filter chips and a result count that changes as facets are applied.
- **Mocked today**: `app/components/store/catalog.vue` renders the filter bar as a **non-functional visual skeleton only** (per explicit user decision, 2026-10-24) — 7 static labels with a chevron-down icon, no click handling, no state, nothing wired. No active-filter chips (there's no filter state to reflect). This was a deliberate scope cut for the product list view redesign, not an oversight.
- **What's actually real vs. not**, verified live (2026-10-24) through this repo's Medusa Store API integration against the connected backend (see `storefront-env-is-production` memory):
  - **Kategoria** — real and already wired, just not through this control: `category_id`/`collection_id` already drive `/categories/[handle]` and `/collections/[handle]` via `StoreCatalog`'s props. Turning the "Kategoria" facet into a working dropdown would mostly be UI work (a `useFetchCategories()`-backed menu that navigates), not a new data source.
  - **Rozmiar, Kolor** — real per-variant product options (`*options,*options.values`, already requested by `product.repository.ts`), confirmed live: e.g. `Size=S/M/L/XL`, `Color=Black/White`. But Medusa's Store API filters products by _option value on a variant_, not by a simple top-level query param — building a working facet needs a client-side or query-level mapping from "Rozmiar: M" to the right variant/option filter, not just a new `fields` request.
  - **Materiał** — real but sparse (see the home "New arrivals" entry above — about a third of products have it, the rest `null`) and there's no indication the Store API supports filtering by it at all (no `material` param on `StoreProductListParams`); would likely need client-side filtering over an already-fetched page, which doesn't work for an accurate count across the full catalog.
  - **Cena** — `StoreProductListParams` has no price-range filter param; price only exists per-variant as `calculated_price.calculated_amount` after calculation, so a working price facet would need either a dedicated backend query/index or fetching+filtering client-side (same accuracy problem as material).
  - **Dla kogo (gender)** — no field for this on `StoreProduct` at all. The closest real proxy is the "Women"/"Men" categories already in the catalog (verified live 2026-10-24 category list includes `women`, `men`), which isn't the same shape as a "Dla kogo" facet with its own values.
  - **Marka (brand)** — doesn't exist, same gap already documented in the home "New arrivals" entry above.
- **Real fix would need**: for a fully working filter bar, in rough order of effort — (1) Kategoria: wire the existing category data into the control, cheapest; (2) Rozmiar/Kolor: a composable that turns facet selections into the right Medusa option/variant filter; (3) Cena: either a backend price-range query or an accepted-tradeoff client-side filter; (4) Materiał: same tradeoff as price, plus accepting it won't apply to products missing the field; (5) Dla kogo, Marka: need new data (a gender concept and a brand/manufacturer concept) before they can exist as real facets at all.

## Search page (`/search`): related search suggestions

- **Needs**: Figma's "Product search" hero (node 12:1617, Fashion file) shows "Szukasz czegoś innego? kardigan · golf · kaszmir" — clickable related-term suggestions under the search field.
- **Shipped for real** (not mocked): the search itself is genuine — `app/pages/[countryCode]/search.vue` submits to `StoreCatalog`'s new `q` prop, which passes `q` straight through to `client.store.product.list` (confirmed live 2026-10-24 through this repo's Medusa Store API integration: `q=shirt` returns 99/319 products with sensible ranking, `q=sweter` returns 0 since this catalog's product titles are in English/demo content, not Polish fashion copy like the Figma mock). `useFetchProducts`'s cache key now includes `q` so different searches don't collide.
- **Mocked today**: nothing — the related-search chips are simply **not implemented**, omitted entirely rather than hardcoded, since there's no relevance/recommendation data source to drive them.
- **Real fix would need**: Medusa's Store API has no "related terms" or search-suggestions endpoint. This would need either a client-side heuristic (e.g. other popular recent queries, which needs search-query analytics this codebase doesn't collect anywhere) or a real search service (Algolia, Typesense, Meilisearch) with faceted suggestion support — a bigger integration than this storefront's direct `client.store.product.list({ q })` usage.
