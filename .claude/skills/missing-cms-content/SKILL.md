---
name: missing-cms-content
description: 'Tracks editorial/marketing content the Fashion home page design needs that has no backing data model in this codebase (no CMS, no blog, no brand/editorial entity). Use when deciding whether to wire up a real content source for one of these sections later.'
---

# Missing CMS content

Content the Figma home page design shows that is not commerce data at all — editorial copy, curated imagery, brand storytelling, journal articles — and has no backing model anywhere in this repo (no CMS integration exists today). Each entry: what the UI needs, what's mocked today and where, what a real content source would need to provide. Do not invent a CMS integration to close these gaps without the user's go-ahead — these are intentionally mocked for now.

Entries are added as each home page section is implemented.

## Header: primary nav routing — wired to Payload

- **Needs**: the Figma header's category nav row ("Marki", "Fashion Studio", "Inspiracje") links to brand-directory, brand-story and editorial/inspiration content that has no backing page or model in this codebase.
- **Now**: `app/components/app/header/category-nav.vue` reads `useFetchNavigation()` (Payload `Navigation` global, via `app/composables/cms.ts`/`app/repository/cms.repository.ts`) and falls back to the static `app/utils/navigation.ts` (`primaryNav`, every entry at `/store`) when Payload has no data or is unreachable. The underlying pages (brand directory, studio/about, inspiration hub) still don't exist — Payload only supplies the link label/URL, not the destination pages themselves.

## Footer: help, world and legal link columns — wired to Payload

- **Needs**: Figma's footer has three static columns beyond the brand/contact block — "Help" (shipping & payments, returns, size guide, order tracking, FAQ), "The Fashion world" (about, studio, journal, materials & care, careers), and a legal links row (terms, privacy, cookies, accessibility).
- **Now**: `app/components/app/footer/menu/help.vue`, `menu/world.vue` and `copyright.vue` read `useFetchFooterContent()` (Payload `FooterContent` global) and fall back to the previous static `/store`-linked lists when Payload has no data or is unreachable. As with the header nav, the destination pages (support/FAQ, about/studio, journal, legal) still don't exist — Payload only supplies labels/URLs.

## Footer: brand contact details and social handle — wired to Payload

- **Needs**: a real support email/phone/hours and social handles.
- **Now**: `app/components/app/footer/menu/brand.vue` reads `useFetchFooterContent()`'s `contact`/`social` fields and falls back to the `app.footer.contact.*` / `app.footer.social.handle` i18n placeholders when Payload has no data or is unreachable. Still waiting on real contact info/social accounts to be entered into Payload — the wiring is in place, the content isn't.

## Home: autumn campaign hero

- **Needs**: a rotating 3-slide campaign carousel (Figma shows "01 / 03" pagination) with per-slide season label, headline, description, CTA, photo and caption.
- **Mocked today**: `app/components/home/campaign.vue` renders only slide 1 as static content (i18n `pages.home.campaign.*`), with non-interactive pagination UI (always shows 01 of 03, no slide-switching). The campaign photo itself is real downloaded artwork (`public/images/home/autumn-campaign.jpg`, from the Figma file) — not a placeholder, just hand-picked for this one slide.
- **Real fix would need**: a real content source for campaign slides (2 more editorial copy sets + photos) and either a simple client-side carousel or a CMS-driven list to loop over, plus the "Dla niego"/secondary CTA label itself is static copy even though its link target is real (second top-level category).

## Home: "Shop by category" curated grid

- **Needs**: 4 editorial category tiles with curated titles/subtitles that don't map 1:1 to raw category names (e.g. Figma's "Koszule i T-shirty" spans two real categories, "Buty i dodatki" has no matching category at all in this catalog — this Medusa instance has no distinct "shoes" category).
- **Mocked today**: `app/components/home/categories.vue` — static i18n copy per card (`pages.home.categories.*`), each linked to the closest real category handle (`sweaters-cardigans`, `shirts`, `jackets-coats`, `accessories`) rather than showing raw `category.name`.
- **Real fix would need**: either editorial curation content (titles/photos chosen per campaign) from the user, a "shoes" category added to the catalog, or accepting that this grid shows curated groupings rather than a literal category listing.

## Home: "Shop the look"

- **Needs**: an editorial "look" — 3 products a stylist picked to go together, with an editorial photo, caption and bottom tagline.
- **Mocked today**: `app/components/home/shop-the-look.vue` resolves 3 real products via `app.config.ts`'s `shopTheLookProductHandles` (real catalog items, real prices via `useFetchProductByHandle`, real total computed from them) — only the *curation* (which 3 products belong together) and the editorial copy/photo are static. No brand line is shown per product (see the "New arrivals" brand/material entry in missing-medusa-api-data — same gap).
- **Real fix would need**: a real "look"/outfit content model (a CMS entry linking N product handles to editorial copy and a photo) instead of a hardcoded array in `app.config.ts`.

## Home: "Selected brands" row

- **Needs**: a row of stocked-brand wordmarks (the storefront's own name, plus SELECTED, Samsøe Samsøe, MARC O'POLO, BIRKENSTOCK), each presumably linking to a brand-filtered view.
- **Mocked today**: `app/components/home/brands.vue` — a static `otherBrands` array of plain text, not linked individually (whole section just has one "view all" link to `/store`). No per-brand image/logo, just styled text, matching the Figma source (which is also plain styled text, not logo images).
- **Real fix would need**: same brand/manufacturer concept gap noted elsewhere (per-product brand attribution, a brand directory page) — this row has no real data to drive it at all today.

## Home: "{title} Studio" story

- **Needs**: a brand-storytelling section about the storefront's own in-house line — editorial photo, philosophy copy, 3 value markers, link to a studio story page.
- **Mocked today**: `app/components/home/studio-story.vue` — fully static i18n copy (`pages.home.studioStory.*`), real downloaded photo (`public/images/home/studio-craft.jpg`), "Discover the {title} Studio story" link points at `/store` (no studio/about page exists, same gap as the header nav entry).
- **Real fix would need**: a real about/studio page and real philosophy copy from the user — this entire section describes a brand sub-line ("{title} Studio") that doesn't exist as a real product line in this catalog (no matching category/collection, see the "Fashion Studio" tab entry in missing-medusa-api-data).

## Home: journal / editorial articles

- **Needs**: 3 blog-style article cards (category, reading time, title, summary, photo) linking to full articles.
- **Mocked today**: `app/components/home/journal.vue` — fully static i18n copy (`pages.home.journal.*`) and real downloaded photos, every card and the "more from the journal" link point at `/store` (no article pages exist). The section has `id="journal"` so the footer's "Dziennik"/"Journal" link (`app/components/app/footer/menu/world.vue`) scrolls to it.
- **Real fix would need**: an actual blog/CMS with article content and routes — no blog concept exists anywhere in this codebase today.
