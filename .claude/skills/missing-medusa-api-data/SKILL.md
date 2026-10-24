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
- **Verified live** (2026-10-24, against `medusaDemo/apps/backend/medusa-config.ts` — the actual backend this storefront's `.env` points at; see `storefront-env-is-production` memory): the `[Modules.PAYMENT]` config lists exactly **one** provider, `@medusajs/medusa/payment-stripe` (id `stripe`) — BLIK/Przelewy24 are payment method types handled *inside* Stripe's own confirmation flow (matches `stripe.repository.ts`), not separate Medusa-level providers a generic "list payment providers" call could enumerate; VISA/Mastercard are card networks, not providers at all. **PayPo is not configured anywhere in this backend.** The `[Modules.FULFILLMENT]` config lists `inpost` (real — same integration as the checkout parcel-locker picker) and `manual` (generic fallback). **DPD is not configured anywhere in this backend.**
- **Real fix would need**: for payment, a composable wired to Medusa's `payment-providers` listing would today return only `["stripe"]` — not the five-badge breakdown — so matching the Figma design needs either badges driven by what Stripe itself has enabled (not a Medusa concept) or accepting the mismatch; PayPo needs a real provider added to `medusa-config.ts` first. For delivery, same story — DPD needs a real fulfillment provider added before it can be anything but a static label.

## Home: "Shop by category" card images

- **Needs**: a photo per featured category tile.
- **Mocked today**: `app/components/home/categories.vue` pairs each real category handle with a local downloaded image (`public/images/home/category-*.jpg`, real Figma artwork, not placeholders) via a static array in the component — `StoreProductCategory`/`BaseProductCategory` (`@medusajs/types`) has no image/thumbnail field, confirmed by `category.repository.ts`'s `fields: 'handle,name,*parent_category,*category_children'`.
- **Real fix would need**: a `metadata.image` convention on categories (nobody currently reads `metadata` anywhere in this codebase) or a real image field added to the category model.

## Home: "New arrivals" card badge, brand line and material/color text

- **Needs**: Figma shows a per-product badge ("NOWOŚĆ"/"DOBRA BAZA", varies by item), a brand name line above the title, and a material/color text line below it.
- **Verified live** (2026-10-24, against the connected backend): temporarily broadened `product.repository.ts`'s `listProducts` `fields` to `+material,+collection.title` and inspected 4 real products — `product.material` was `null` on every one (field exists on `StoreProduct` but isn't populated in this catalog), and Medusa has no brand/manufacturer field at all. `collection.title` *is* populated (e.g. "Wybór tygodnia", "Nowości") but isn't a brand and wasn't used. Change was reverted (not shipped) except for the separate, intentional `*options,*options.values` addition described below.
- **Mocked today**: `app/components/home/new-arrivals.vue` passes one uniform `badge` (`pages.home.newArrivals.badge`, "Nowość") to every card in the section via `ProductCard`'s new `badge` prop — defensible since the whole section is sorted newest-first, but it can't reproduce Figma's per-item variety. Brand line and material/color line are omitted entirely (not faked) since the data is null/absent.
- **Real fix would need**: real `material` values populated on products, and a brand/manufacturer concept added to the backend (new module or a `metadata` convention) before per-product brand attribution is possible anywhere in the storefront.

## Home: "New arrivals" color swatches

- **Needs**: color dots per product card.
- **Verified live** (2026-10-24): same diagnostic as above — some products (not all) have a real Medusa "Color" product option with plain-text values (e.g. "Black", "White"); no hex/swatch data, confirmed by `@medusajs/types`' `StoreProductOptionValue` shape (just `value: string`).
- **Shipped for real** (not mocked data, mocked *rendering* only): `product.repository.ts`'s `listProducts` now requests `*options,*options.values` — a genuine, permanent fields addition (not reverted), since this data is real and the plan anticipated it. `ProductCard` finds an option whose title matches `/colou?r|kolor/i` and renders a dot per value via `getSwatchColor()` (`app/utils/color.ts`), a small color-name → hex map, omitting the row entirely for products with no color option.
- **Real fix would need**: nothing further for swatches to work generically — the name → hex map only needs to grow as new color option values show up in the catalog that aren't already covered.

## Home: "New arrivals" — "Fashion Studio" tab

- **Needs**: a third department tab alongside "Dla niej"/"Dla niego".
- **Mocked today**: `app/components/home/new-arrivals.vue` has no category/collection mapping for this tab — falls back to `category_id: undefined`, i.e. the newest products overall, same as no filter.
- **Real fix would need**: a "Fashion Studio" product line (category or collection) in the catalog — doesn't exist today (full category list verified live 2026-10-24: shirts, sweatshirts, pants, merch, dresses, jackets-coats, sportswear, accessories, women, men, t-shirts-tops, sweaters-cardigans, skirts).

## Home: "Shop the look" — buy the whole set

- **Needs**: a single "Shop this set" action that adds all 3 looked-up products (with a size per item) to the cart at once.
- **Mocked today**: `app/components/home/shop-the-look.vue`'s CTA just links to the first product's page — no multi-item add-to-cart happens.
- **Real fix would need**: `useAddToCart`/`cart.service.ts` only take one line item at a time; a "buy the set" action would need either a loop of individual add calls (still needs a size picked per item first, which the UI doesn't collect here) or a true bulk-add endpoint — plus a size-selection UI this component doesn't have.

## Home: newsletter signup

- **Needs**: a working email signup form (with interest checkboxes and marketing consent) that actually subscribes the visitor.
- **Mocked today**: `app/components/home/newsletter.vue` validates the email format and that consent is checked client-side, then just shows a local "thanks for signing up" success state — no request is sent anywhere. No newsletter/ESP (email service provider) integration, composable, repository, or server route exists anywhere in this codebase.
- **Real fix would need**: a real newsletter provider (Klaviyo, Mailchimp, a Medusa customer-group/marketing-consent field, etc.) and a server route or repository to call it from.
