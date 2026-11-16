---
name: payload-backend-todo
description: 'Tracks the Payload CMS backend contract (Collections/Globals, fields, locales, access rules) this Nuxt storefront assumes but does not itself implement — Payload lives in a separate repo/instance. Use when setting up or configuring that Payload instance, or when adding a new app/repository/cms.repository.ts fetcher that needs a new Global/Collection.'
---

# Payload backend TODO

This repo only contains the Nuxt-side consumption layer for Payload CMS (`app/repository/cms.repository.ts`, `app/composables/cms.ts`, `app/types/cms.ts`, and on the server `server/api/cms/[slug].get.ts` plus `server/repository/payload.repository.ts`) — see "Payload CMS integration" in `CLAUDE.md`. No Payload backend is configured here. Each entry below is a Global/Collection that `cms.repository.ts` already calls and that a connected Payload instance must provide with this exact REST shape for the storefront to show that content. The storefront has no static fallback: a missing or unreachable Global means that section is not rendered.

Conventions used throughout:

- Base contract: `GET {NUXT_PUBLIC_PAYLOAD_URL}/api/globals/<slug>?locale=<en|pl>&depth=<n>` for Globals (standard Payload REST, no custom endpoints). The browser never calls it: Payload sends no CORS headers for the storefront, so `cms.repository.ts` goes through the same-origin `server/api/cms/[slug]` proxy, which forwards `locale` and `depth` (0–2) to that URL through `payloadRepository().fetchGlobal()` (`server/repository/payload.repository.ts`), the only place that knows `/api/globals/<slug>`. It strips a trailing `/` from `NUXT_PUBLIC_PAYLOAD_URL` and aborts after 5 seconds; every upstream failure (a Payload 404 included) is a 502, which `payloadRepository()` reports once (`source: 'payload'`, `cms_global`) and `fetchGlobal()` turns into `null`, so the section isn't rendered. A new Global's slug must be added to `CMS_GLOBAL_SLUGS` in `app/types/cms.ts`, or the proxy answers 404. `cms.repository.ts`'s `fetchGlobal()` defaults `depth` to `0`; any Global with an upload/relationship field (an `image`) is fetched with `depth=1` instead, so `image.url`/`image.alt` come back populated rather than a bare Media id — check each entry below for which it uses.
- Every field listed is **required** (`required: true` in Payload) unless its entry says it is optional. `cms.repository.ts` parses each Global with its zod schema in `app/types/cms.ts` (the **Type** named in each entry is inferred from it): a Global with a missing, renamed or `null` required field is reported (`captureError`, `type: 'invalid_response'`) and its section is not rendered at all, so one empty field hides the whole section. An untranslated localized field is `null` too, so keep Payload's localization `fallback` on (the default) or translate every field. Optional today: every Media `alt` (missing = decorative image, `''`) and all of `FooterContent`'s `contact`/`social` fields. Extra fields Payload adds (ids, `globalType`, timestamps, array row ids) are ignored. Changing a field here means changing its schema in the same change.
- Every text field listed must have `localized: true` and the Payload instance's `localization` config must declare exactly `{ locales: ['en', 'pl'], defaultLocale: 'en' }` to match this app's `i18n.locales`.
- Public read returns **only the published version**, also for an anonymous `?draft=true` (Payload has drafts on every Global since simple-landing-page-nuxt PR #26; its `read` access matches `_status: published` for anyone who may not read drafts). The public proxy sends no API key. Only the draft preview below reads drafts, with its own key.
- A field named `url`/`to` should be a storefront-relative path (e.g. `/store`) or an absolute URL — `cms.repository.ts` doesn't rewrite it.
- `nuxt.config.ts` adds `NUXT_PUBLIC_PAYLOAD_URL`'s hostname, plus any hostnames listed in `NUXT_PUBLIC_PAYLOAD_IMAGE_HOSTS` (e.g. the bucket host of Payload's `S3_FILE_URL`), to `image.domains` at build/start time so `@nuxt/image`'s `NuxtImg` (used for every `image.url`/`image.alt` field below, same as the rest of the app) actually optimizes Payload-hosted images instead of silently serving them unoptimized. Changing `NUXT_PUBLIC_PAYLOAD_URL` to a different host needs a restart (dev) or redeploy (prod) to pick up the new domain — it isn't runtime-reactive.

## Draft preview (storefront #53, Payload simple-landing-page-nuxt#20)

What the storefront expects from Payload for the draft preview (the storefront side is "Draft preview" in `CLAUDE.md`). Payload implements it in `payload-cms/src/preview/previewUrl.ts`, `src/globals/preview.ts`, `src/access/globalDrafts.ts` and `src/collections/ServiceUsers.ts`; change both repos together.

- **Entry link** (Preview button and Live Preview pane of each Global, shown only with Payload's `STOREFRONT_URL` and `PREVIEW_SECRET`): `GET {STOREFRONT_URL}/api/preview?token=<JWT>&locale=<en|pl>&path=/&global=<slug>`. `path` must be a plain storefront path relative to the country (`/`, `/store`; letters, digits, `-`, `_`, `/`), `global` a slug (`[a-z0-9-]`), `locale` `en` or `pl`; anything else is a 400.
- **Token**: HS256 signed with `PREVIEW_SECRET` (= the storefront's `NUXT_PAYLOAD_PREVIEW_SECRET`, at least 32 characters, or the storefront keeps the preview off), `iss: payload-cms`, `aud: storefront-preview`, claims `sub` (Payload user id), `global` and `locale` (both must equal the link's query), `iat` and `exp` with `exp - iat` at most 2 h (Payload: quantised to the hour, exactly 2 h). The storefront allows ±60 s of clock skew. A longer lifetime, another algorithm or a missing claim is a 401, never a fallback.
- **Answer**: 302 to `/{country}{path}?preview=1#token=<JWT>`; `pl` goes to `/pl`, `en` to the first other region country. The page then sends the token only in the `x-preview-token` header.
- **Draft read** (storefront server only): `GET {NUXT_PUBLIC_PAYLOAD_URL}/api/globals/<slug>?locale=&depth=&draft=true` with `Authorization: <collection> API-Key <key>` (`NUXT_PAYLOAD_PREVIEW_API_KEY_COLLECTION`, default `service-users`; `NUXT_PAYLOAD_PREVIEW_API_KEY`). The key belongs to a `service-users` account that can only read draft Globals. Same shape as the published Global plus `_status` (stripped by the schemas). **A wrong key silently returns the published version**, so check the key when a preview shows no drafts.
- **Anonymous `?draft=true` must keep returning the published version** (Payload's test matrix in PR #26 covers it). The storefront's public proxy never sends `draft` or a key, but this is an independent layer.
- **Frames**: the storefront allows `frame-ancestors 'self' <Payload origin> <NUXT_PAYLOAD_PREVIEW_FRAME_ANCESTORS>` on preview responses only (the Medusa admin origins, because Payload sits in the Medusa admin). Payload's own `frame-ancestors` (`MEDUSA_ADMIN_URLS`) is separate. Every other storefront response has `frame-ancestors 'self'` (#62).
- **Live Preview messages** (storefront page side, not implemented yet): the page posts `{ type: 'payload-live-preview', ready: true }` to the Payload origin and refetches drafts on `payload-document-event`, accepting messages only from the Payload origin.
- **Known gap**: Payload puts the token in the entry link's query string, so that one request is in the storefront's access logs (valid for up to 2 h, read-only drafts). A fragment on Payload's side would avoid it but needs a storefront page instead of the `/api/preview` route.

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
