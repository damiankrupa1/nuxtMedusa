---
name: missing-cms-content
description: 'Tracks editorial/marketing content the Fashion home page design needs that has no backing data model in this codebase (no CMS, no blog, no brand/editorial entity). Use when deciding whether to wire up a real content source for one of these sections later.'
---

# Missing CMS content

Content the Figma home page design shows that is not commerce data at all — editorial copy, curated imagery, brand storytelling, journal articles — and has no backing model anywhere in this repo (no CMS integration exists today). Each entry: what the UI needs, what's mocked today and where, what a real content source would need to provide. Do not invent a CMS integration to close these gaps without the user's go-ahead — these are intentionally mocked for now.

Entries are added as each home page section is implemented.

## Header: primary nav routing

- **Needs**: the Figma header's category nav row ("Marki", "Fashion Studio", "Inspiracje") links to brand-directory, brand-story and editorial/inspiration content that has no backing page or model in this codebase.
- **Mocked today**: `app/utils/navigation.ts` (`primaryNav`) points every entry at `/store` as a placeholder.
- **Real fix would need**: dedicated pages/routes for a brand directory, a studio/about page, and an inspiration/editorial hub — none exist yet.

## Footer: help, world and legal link columns

- **Needs**: Figma's footer has three static columns beyond the brand/contact block — "Help" (shipping & payments, returns, size guide, order tracking, FAQ), "The Fashion world" (about, studio, journal, materials & care, careers), and a legal links row (terms, privacy, cookies, accessibility).
- **Mocked today**: `app/components/app/footer/menu/help.vue`, `app/components/app/footer/menu/world.vue` link every item at `/store`; `app/components/app/footer/copyright.vue` (`legalLinks`) does the same.
- **Real fix would need**: actual support/FAQ, about/studio, journal and legal pages — none exist in this codebase today.

## Footer: brand contact details and social handle

- **Needs**: a real support email/phone/hours and social handles.
- **Mocked today**: `app/components/app/footer/menu/brand.vue` via `app.footer.contact.*` / `app.footer.social.handle` i18n keys with placeholder values.
- **Real fix would need**: real store contact info and social accounts from the user.

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
