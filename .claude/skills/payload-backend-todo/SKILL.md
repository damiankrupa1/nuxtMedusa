---
name: payload-backend-todo
description: 'Tracks the Payload CMS backend contract (Collections/Globals, fields, locales, access rules) this Nuxt storefront assumes but does not itself implement — Payload lives in a separate repo/instance. Use when setting up or configuring that Payload instance, or when adding a new app/repository/cms.repository.ts fetcher that needs a new Global/Collection.'
---

# Payload backend TODO

This repo only contains the Nuxt-side consumption layer for Payload CMS (`app/repository/cms.repository.ts`, `app/composables/cms.ts`, `app/types/cms.ts`) — see "Payload CMS integration" in `CLAUDE.md`. No Payload backend is configured here. Each entry below is a Global/Collection that `cms.repository.ts` already calls and that a connected Payload instance must provide with this exact REST shape for the storefront to show real content instead of its static i18n fallback.

Conventions used throughout:

- Base contract: `GET {NUXT_PUBLIC_PAYLOAD_URL}/api/globals/<slug>?locale=<en|pl>&depth=0` for Globals, `GET {NUXT_PUBLIC_PAYLOAD_URL}/api/<slug>?locale=<en|pl>&depth=<n>` for Collections (standard Payload REST, no custom endpoints).
- Every text field listed must have `localized: true` and the Payload instance's `localization` config must declare exactly `{ locales: ['en', 'pl'], defaultLocale: 'en' }` to match this app's `i18n.locales`.
- `access.read: () => true` on each (public read-only) — matches the "publiczny read-only REST" transport decision; no API key is sent from this app.
- A field named `url`/`to` should be a storefront-relative path (e.g. `/store`) or an absolute URL — `cms.repository.ts` doesn't rewrite it.

## `Navigation` (Global) — implemented

- **Slug**: `navigation`
- **Fields**: `primaryNav` — array of `{ label: text (localized), url: text }`.
- **Consumed by**: `useFetchNavigation()` → `app/components/app/header/category-nav.vue`.
- **Type**: `CmsNavigation` in `app/types/cms.ts`.

## `FooterContent` (Global) — implemented

- **Slug**: `footer-content`
- **Fields**:
  - `helpLinks`, `worldLinks`, `legalLinks` — each an array of `{ label: text (localized), url: text }`.
  - `contact` — group `{ email: text, phone: text, hours: text (localized) }`.
  - `social` — group `{ handle: text }`.
- **Consumed by**: `useFetchFooterContent()` → `app/components/app/footer/menu/help.vue`, `menu/world.vue`, `menu/brand.vue`, `copyright.vue`.
- **Type**: `CmsFooterContent` in `app/types/cms.ts`.

## `StudioStory` (Global) — implemented

- **Slug**: `studio-story`
- **Fields**: `eyebrow`, `headlineLine1`, `headlineLine2`, `paragraph1`, `paragraph2` — localized text; `values` — array of localized text (3 short value markers); `signatureLabel`, `signatureTagline` — localized text; `collectionLinkLabel` — localized text; `collectionUrl` — text (storefront-relative path); `image` — upload relationship to `Media`, resolved with `depth=1`+ so `image.url`/`image.alt` come back populated (plain strings, not a `Media` id).
- **Consumed by**: `useFetchStudioStory()` → `app/components/home/studio-story.vue`.
- **Type**: `CmsStudioStory` in `app/types/cms.ts`.
- **Note**: all editorial copy here is final, localized text written by an editor — it does not need `{title}` brand-name interpolation the way the i18n fallback does, since Payload content is never a template.

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

## Not yet implemented (see `missing-cms-content` for the product-side need)

These home-page sections are still mocked with static i18n content in `app/components/home/*.vue`; no `cms.repository.ts` fetcher exists for them yet. Add the Payload Global/Collection and the matching entry above in the same change as the Nuxt fetcher, so this file never drifts from `cms.repository.ts`.

- `CategoryTiles` (Collection) — curated "shop by category" grid (`home/categories.vue`); needs a `categoryHandle` field the Nuxt service layer resolves against Medusa — Payload never stores category data itself.
- `ShopTheLook` (Collection) — editorial look (`home/shop-the-look.vue`); needs a `productHandles` (array of text) field the Nuxt service layer resolves against Medusa — Payload never stores product/price data itself.
- `Pages` + `blocks` (Collection) — generic CMS pages for legal/about/FAQ content, following the `blocks`-union pattern seen in `simple-landing-page-nuxt`'s `payload-cms/src/collections/Pages.tsx`.
