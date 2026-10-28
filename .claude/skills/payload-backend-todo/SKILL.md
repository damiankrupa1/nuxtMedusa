---
name: payload-backend-todo
description: 'Tracks the Payload CMS backend contract (Collections/Globals, fields, locales, access rules) this Nuxt storefront assumes but does not itself implement — Payload lives in a separate repo/instance. Use when setting up or configuring that Payload instance, or when adding a new app/repository/cms.repository.ts fetcher that needs a new Global/Collection.'
---

# Payload backend TODO

This repo only contains the Nuxt-side consumption layer for Payload CMS (`app/repository/cms.repository.ts`, `app/composables/cms.ts`, `app/types/cms.ts`) — see "Payload CMS integration" in `CLAUDE.md`. No Payload backend is configured here. Each entry below is a Global/Collection that `cms.repository.ts` already calls and that a connected Payload instance must provide with this exact REST shape for the storefront to show that content. The storefront has no static fallback: a missing or unreachable Global means that section is not rendered.

Conventions used throughout:

- Base contract: `GET {NUXT_PUBLIC_PAYLOAD_URL}/api/globals/<slug>?locale=<en|pl>&depth=<n>` for Globals (standard Payload REST, no custom endpoints). The browser never calls it: Payload sends no CORS headers for the storefront, so `cms.repository.ts` goes through the same-origin `server/api/cms/[slug]` proxy, which forwards `locale` and `depth` (0–2) to that URL. A new Global's slug must be added to `CMS_GLOBAL_SLUGS` in `app/types/cms.ts`, or the proxy answers 404. `cms.repository.ts`'s `fetchGlobal()` defaults `depth` to `0`; any Global with an upload/relationship field (an `image`) is fetched with `depth=1` instead, so `image.url`/`image.alt` come back populated rather than a bare Media id — check each entry below for which it uses.
- Every field listed is **required** (`required: true` in Payload) unless its entry says it is optional. `cms.repository.ts` parses each Global with its zod schema in `app/types/cms.ts` (the **Type** named in each entry is inferred from it): a Global with a missing, renamed or `null` required field is reported (`captureError`, `type: 'invalid_response'`) and its section is not rendered at all, so one empty field hides the whole section. An untranslated localized field is `null` too, so keep Payload's localization `fallback` on (the default) or translate every field. Optional today: every Media `alt` (missing = decorative image, `''`) and all of `FooterContent`'s `contact`/`social` fields. Extra fields Payload adds (ids, `globalType`, timestamps, array row ids) are ignored. Changing a field here means changing its schema in the same change.
- Every text field listed must have `localized: true` and the Payload instance's `localization` config must declare exactly `{ locales: ['en', 'pl'], defaultLocale: 'en' }` to match this app's `i18n.locales`.
- `access.read: () => true` on each (public read-only) — matches the "publiczny read-only REST" transport decision; no API key is sent from this app.
- A field named `url`/`to` should be a storefront-relative path (e.g. `/store`) or an absolute URL — `cms.repository.ts` doesn't rewrite it.
- `nuxt.config.ts` adds `NUXT_PUBLIC_PAYLOAD_URL`'s hostname, plus any hostnames listed in `NUXT_PUBLIC_PAYLOAD_IMAGE_HOSTS` (e.g. the bucket host of Payload's `S3_FILE_URL`), to `image.domains` at build/start time so `@nuxt/image`'s `NuxtImg` (used for every `image.url`/`image.alt` field below, same as the rest of the app) actually optimizes Payload-hosted images instead of silently serving them unoptimized. Changing `NUXT_PUBLIC_PAYLOAD_URL` to a different host needs a restart (dev) or redeploy (prod) to pick up the new domain — it isn't runtime-reactive.

## `Navigation` (Global) — implemented

- **Slug**: `navigation`
- **Fields**: `primaryNav` — array of `{ label: text (localized), url: text }`.
- **Consumed by**: `useFetchNavigation()` → `app/components/app/header/category-nav.vue`.
- **Type**: `CmsNavigation` in `app/types/cms.ts`.

## `FooterContent` (Global) — implemented

- **Slug**: `footer-content`
- **Fields**:
  - `helpLinks`, `worldLinks`, `legalLinks` — each an array of `{ label: text (localized), url: text }`.
  - `contact` — group `{ email: text, phone: text, hours: text (localized) }`, all **optional**: an empty one is left out of the footer, and the block is hidden when none is entered.
  - `social` — group `{ handle: text }`, **optional** (hidden when empty).
- **Consumed by**: `useFetchFooterContent()` → `app/components/app/footer/menu/help.vue`, `menu/world.vue`, `menu/brand.vue`, `copyright.vue`.
- **Type**: `CmsFooterContent` in `app/types/cms.ts`.

## `StudioStory` (Global) — implemented

- **Slug**: `studio-story`
- **Fields**: `eyebrow`, `headlineLine1`, `headlineLine2`, `paragraph1`, `paragraph2` — localized text; `values` — array of localized text (3 short value markers); `signatureLabel`, `signatureTagline` — localized text; `collectionLinkLabel` — localized text; `collectionUrl` — text (storefront-relative path); `image` — upload relationship to `Media`, resolved with `depth=1`+ so `image.url`/`image.alt` come back populated (plain strings, not a `Media` id).
- **Consumed by**: `useFetchStudioStory()` → `app/components/home/studio-story.vue`.
- **Type**: `CmsStudioStory` in `app/types/cms.ts`.
- **Note**: all editorial copy here is final, localized text written by an editor — it does not need `{title}` brand-name interpolation, since Payload content is never a template.

## `Brands` (Global) — implemented

- **Slug**: `brands`
- **Fields**: `eyebrow`, `viewAllLabel` — localized text; `viewAllUrl` — text (storefront-relative path); `otherBrands` — array of text, **not localized** (brand wordmarks are proper nouns).
- **Consumed by**: `useFetchBrands()` → `app/components/home/brands.vue`.
- **Type**: `CmsBrands` in `app/types/cms.ts`.
- **Note**: the storefront's own name shown alongside `otherBrands` comes from this app's `useAppConfig().title`, not from Payload — don't add a field for it.

## `JournalSection` (Global) — implemented

- **Slug**: `journal-section`
- **Fields**: `eyebrow`, `heading`, `viewAllLabel` — localized text; `viewAllUrl` — text; `articles` — array (fixed at 3 today) of `{ category: text (localized), readingTime: text (localized), title: text (localized), summary: text (localized), image: upload relationship to Media, url: text }`.
- **Consumed by**: `useFetchJournalSection()` → `app/components/home/journal.vue`.
- **Type**: `CmsJournalSection` in `app/types/cms.ts`.
- **Note**: deliberately a Global with an array field, not a `JournalArticles` Collection — the home page only ever shows a fixed curated set of cards, not a paginated/browsable blog. If a real article-per-page blog is wanted later, that's a bigger, separate feature (a true `Collection` with slugs and detail pages) and should replace this, not extend it.

## `CampaignSlides` (Global) — implemented

- **Slug**: `campaign-slides`
- **Fields**: `slides` — array of `{ seasonLabel, editionLabel, headlineLine1, headlineLine2, description, shopCtaLabel, secondaryCtaLabel, tagline, captionEyebrow, captionHeadline: text, all localized; image: upload relationship to Media }`.
- **Consumed by**: `useFetchCampaignSlides()` → `app/components/home/campaign.vue` (real clickable pagination over `slides.length`).
- **Type**: `CmsCampaignSlides`/`CmsCampaignSlide` in `app/types/cms.ts`.
- **Note**: neither slide field carries a CTA URL — the primary CTA always goes to `/store` and the secondary CTA always goes to the real men's-department category (`useDepartmentCategories()`); both are live commerce routing the Nuxt app owns, not Payload. Don't add `shopCtaUrl`/`secondaryCtaUrl` fields without also changing the component to use them.

## `CategoryTiles` (Global) — implemented

- **Slug**: `category-tiles`
- **Fields**: `eyebrow`, `heading`, `description` — localized text; `cards` — array of `{ title: text (localized), subtitle: text (localized), categoryHandle: text, image: upload relationship to Media }`.
- **Consumed by**: `useFetchCategoryTiles()` → `app/components/home/categories.vue`. Resolved against real Medusa categories by `app/services/cms.service.ts`'s `getResolvedCategoryTiles()` before reaching the composable — any card whose `categoryHandle` doesn't match a real category is dropped.
- **Type**: `CmsCategoryTiles`/`CmsCategoryTile` in `app/types/cms.ts`.
- **Note**: `categoryHandle` must be a real, existing Medusa category handle (e.g. `sweaters-cardigans`) — a stale or typo'd value just makes that card silently disappear from the grid rather than linking to a 404. Payload never stores the category's own name/data; `title`/`subtitle` are free-form editorial copy that doesn't need to match the real category name (see missing-cms-content for why — curated groupings don't map 1:1 to raw categories).

## `ShopTheLook` (Global) — implemented

- **Slug**: `shop-the-look`
- **Fields**: `eyebrow`, `headlineLine1`, `headlineLine2`, `description`, `captionLabel`, `bottomTagline`, `shopSetCtaLabel`, `totalLabel`, `sizeHint` — localized text; `productHandles` — array of text (real Medusa product handles); `image` — upload relationship to Media.
- **Consumed by**: `useFetchShopTheLook()` → `app/components/home/shop-the-look.vue`. Resolved against real Medusa products by `app/services/cms.service.ts`'s `getResolvedShopTheLook()` before reaching the composable — any handle that doesn't match a real product is dropped, and the matching `StoreProduct`s are attached as `products` for live price/total rendering.
- **Type**: `CmsShopTheLook` in `app/types/cms.ts`; the resolved shape (`CmsShopTheLook & { products: StoreProduct[] }`) is `ResolvedShopTheLook` in `app/services/cms.service.ts`.
- **Note**: Payload never stores price/stock — those always come live from the resolved Medusa products. A stale or typo'd handle just drops that product from the look instead of showing a broken price.

## Not yet implemented (see `missing-cms-content` for the product-side need)

These are still mocked with static i18n/hardcoded content; no `cms.repository.ts` fetcher exists for them yet. Add the Payload Global/Collection and the matching entry above in the same change as the Nuxt fetcher, so this file never drifts from `cms.repository.ts`.

- `Pages` + `blocks` (Collection) — generic CMS pages for legal/about/FAQ content, following the `blocks`-union pattern seen in `simple-landing-page-nuxt`'s `payload-cms/src/collections/Pages.tsx`.
