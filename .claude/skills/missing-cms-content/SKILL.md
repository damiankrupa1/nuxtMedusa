---
name: missing-cms-content
description: 'Tracks editorial/marketing content the Fashion home page design needs that has no backing data model in this codebase (no CMS, no blog, no brand/editorial entity). Use when deciding whether to wire up a real content source for one of these sections later.'
---

# Missing CMS content

Content the Figma home page design shows that is not commerce data at all — editorial copy, curated imagery, brand storytelling, journal articles — and has no backing model anywhere in this repo (no CMS integration exists today). Each entry: what the UI needs, what's mocked today and where, what a real content source would need to provide. All of it is served by Payload (see `payload-backend-todo` for the contract). There is deliberately no static fallback: when a Global is missing or Payload is unreachable, the section is simply not rendered. Don't add stand-in copy or images to a component.

Entries are added as each home page section is implemented.

## Header: primary nav routing — wired to Payload

- **Needs**: the Figma header's category nav row ("Marki", "Fashion Studio", "Inspiracje") links to brand-directory, brand-story and editorial/inspiration content that has no backing page or model in this codebase.
- **Now**: `app/components/app/header/category-nav.vue` and `side-menu.vue` read `useFetchNavigation()` (Payload `Navigation` global, via `app/composables/cms.ts`/`app/repository/cms.repository.ts`); the nav is not rendered without data. The underlying pages (brand directory, studio/about, inspiration hub) still don't exist — Payload only supplies the link label/URL, not the destination pages themselves.

## Footer: help, world and legal link columns — wired to Payload

- **Needs**: Figma's footer has three static columns beyond the brand/contact block — "Help" (shipping & payments, returns, size guide, order tracking, FAQ), "The Fashion world" (about, studio, journal, materials & care, careers), and a legal links row (terms, privacy, cookies, accessibility).
- **Now**: `app/components/app/footer/menu/help.vue`, `menu/world.vue` and `copyright.vue` read `useFetchFooterContent()` (Payload `FooterContent` global); a column or the legal row is not rendered without data. As with the header nav, the destination pages (support/FAQ, about/studio, journal, legal) still don't exist — Payload only supplies labels/URLs.

## Footer: brand contact details and social handle — wired to Payload

- **Needs**: a real support email/phone/hours and social handles.
- **Now**: `app/components/app/footer/menu/brand.vue` reads `useFetchFooterContent()`'s `contact`/`social` fields; each block is not rendered without data. Still waiting on real contact info/social accounts to be entered into Payload — the wiring is in place, the content isn't.

## Home: autumn campaign hero — wired to Payload

- **Needs**: a rotating 3-slide campaign carousel (Figma shows "01 / 03" pagination) with per-slide season label, headline, description, CTA, photo and caption.
- **Now**: `app/components/home/campaign.vue` reads `useFetchCampaignSlides()` (Payload `CampaignSlides` global) and renders a real, clickable slide-switching pagination over however many slides Payload has; the whole hero is not rendered without slides. The "Dla niego"/secondary CTA's link target is still computed from real Medusa category data (`useDepartmentCategories()`) — Payload only ever supplies that CTA's label, never its URL, since the URL is live commerce routing, not editorial content.

## Home: "Shop by category" curated grid — wired to Payload

- **Needs**: 4 editorial category tiles with curated titles/subtitles that don't map 1:1 to raw category names (e.g. Figma's "Koszule i T-shirty" spans two real categories, "Buty i dodatki" has no matching category at all in this catalog — this Medusa instance has no distinct "shoes" category).
- **Now**: `app/components/home/categories.vue` reads `useFetchCategoryTiles()` (Payload `CategoryTiles` global, resolved against real Medusa categories by `app/services/cms.service.ts`'s `getResolvedCategoryTiles()` — any card whose `categoryHandle` doesn't match a real category is dropped rather than linking to a 404). The section is not rendered when Payload has no data or none of its handles resolve. A "shoes" category still doesn't exist in the catalog — a curated tile for it would need one added, or editorial acceptance that the grid skips it.

## Home: "Shop the look" — wired to Payload

- **Needs**: an editorial "look" — 3 products a stylist picked to go together, with an editorial photo, caption and bottom tagline.
- **Now**: `app/components/home/shop-the-look.vue` reads `useFetchShopTheLook()` (Payload `ShopTheLook` global, resolved against real Medusa products by `app/services/cms.service.ts`'s `getResolvedShopTheLook()` — any `productHandles` entry that no longer matches a real product is dropped). The section is not rendered when Payload has no data or none of its handles resolve. Prices/totals are always computed live from the resolved Medusa products. No brand line is shown per product (see the "New arrivals" brand/material entry in missing-medusa-api-data — same gap).

## Home: "Selected brands" row

- **Needs**: a row of stocked-brand wordmarks (the storefront's own name, plus SELECTED, Samsøe Samsøe, MARC O'POLO, BIRKENSTOCK), each presumably linking to a brand-filtered view.
- **Now**: `app/components/home/brands.vue` reads `useFetchBrands()` (Payload `Brands` global) for the eyebrow/view-all copy and the `otherBrands` wordmark list; the row is not rendered without data. The storefront's own name still comes from `useAppConfig()`, not Payload. Still no per-brand image/logo or individual brand links — same brand/manufacturer concept gap noted elsewhere (per-product brand attribution, a brand directory page).

## Home: "{title} Studio" story — wired to Payload

- **Needs**: a brand-storytelling section about the storefront's own in-house line — editorial photo, philosophy copy, 3 value markers, link to a studio story page.
- **Now**: `app/components/home/studio-story.vue` reads `useFetchStudioStory()` (Payload `StudioStory` global); the section is not rendered without data. The link target (`collectionUrl`) still has nowhere real to point — no studio/about page exists, same gap as the header nav entry — and this "{title} Studio" sub-line still doesn't exist as a real product line in the catalog (no matching category/collection, see the "Fashion Studio" tab entry in missing-medusa-api-data).

## Home: journal / editorial articles — wired to Payload

- **Needs**: 3 blog-style article cards (category, reading time, title, summary, photo) linking to full articles.
- **Now**: `app/components/home/journal.vue` reads `useFetchJournalSection()` (Payload `JournalSection` global — a fixed-size curated list, not a paginated blog collection); the section is not rendered without data. The section still has `id="journal"`. Article `url`s still have nowhere real to point until actual article pages/routes exist — Payload only supplies the label/URL per card, same gap as the header nav and footer link columns.
