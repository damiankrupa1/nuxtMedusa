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
