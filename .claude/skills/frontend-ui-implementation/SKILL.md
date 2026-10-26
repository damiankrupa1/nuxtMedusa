---
name: frontend-ui-implementation
description: Implement polished, responsive storefront UI from a design, screenshot, Figma reference, or written requirements. Use for layout, styling, component, and design-system work.
---

# Frontend UI Implementation

## Understand the reference

- Identify the intended hierarchy, spacing, typography, colors, image ratios, responsive behavior, and interactive states before coding.
- If a screenshot/reference is supplied, reproduce its structure and visual priorities rather than inventing a different design.
- If Figma/browser inspection tools are unavailable, state the limitation and work from the available reference; do not claim pixel-perfect verification without visual comparison.
- Before deciding a section is specific to one page, check every screen in the design for it — not just where the code uses it today. A section that appears on more than one screen belongs in `app/components/app/` (see the placement rules in `nuxt-vue-architecture`).

## Design source

- Figma file `DhPbwldUg4mqgwzo7N7Oj0` ("Fashion"), one page (`0:1`) with two screens:
  - `3:3845` "RÓWNE — strona główna" — the home page (`app/pages/[countryCode]/index.vue`).
  - `12:1572` "RÓWNE — wyszukiwarka produktów" — the product search page (`search.vue`), also the reference for the other `StoreCatalog` pages (`store.vue`, `categories/[handle].vue`, `collections/[handle].vue`).
- Both screens end with the same stack: "Shopping assurances" → "Newsletter signup" → "Footer", implemented in `app/layouts/default.vue` as `AppBenefitsBar` + `AppNewsletter` (only on pages with `definePageMeta({ prefooter: true })`) followed by `AppFooter`.
- There are no designs for product detail, cart, checkout, account or order pages. Say so instead of inventing a layout, and ask before adding design-only sections (like the newsletter) there.

## Design inconsistencies between screens

- When the same section differs slightly between screens (e.g. "Newsletter signup" is 340px tall with 72px top padding on home but 324px/64px on search; "Shopping assurances" is 127px vs 111px), treat it as a design error, not an intentional variant: reuse the one component unchanged. Don't add size props or variants just to match each screen pixel-perfectly.
- The same applies within one screen: the newsletter's interest checkboxes are 12×12px (`12:1858`, `12:1861`) but its consent checkbox is 13×13px (`12:1864`). All three use `UCheckbox size="xs"` (12px).
- Inconsistencies found in the redesigned sections' code, all normalized by the recurring-block components below (issue #25) and still to be confirmed with the designer:
  - Serif section heading: 48px with `leading-[1.05]` in categories, journal and new-arrivals, but 51px with `leading-none` in the newsletter (normalized to 48px/1.05 by `AppSectionIntro`, along with its `ink` eyebrow → `muted`). At 56px the leading is `none` (studio-story), `0.98` (shop-the-look) and `1.05` (search) — three values for one size.
  - Eyebrow: `text-color-muted` in five sections, `text-color-ink` only in the newsletter (`sage` in shop-the-look is the dark-background tone, not an inconsistency). Gap between eyebrow and heading: `gap-2.5` (new-arrivals) vs `gap-3` (categories).
  - Filled arrow CTA: `h-12 gap-7 font-medium` in campaign and shop-the-look, `h-11 gap-[22px]` without `font-medium` in the search submit.
  - Intro spacing: eyebrow → heading was 28px (`gap-7`) in studio-story and 24/25px (`gap-6 lg:gap-[25px]`) in shop-the-look, heading → lead 24/25px in shop-the-look; `AppSectionIntro` makes them 12px and 20px.
  - Breakpoints at 56px: search went 36 → 48px (`md`) → 56px (`lg`), shop-the-look 36 → 56px at `lg`; `size="lg"` is 36 → 56px at `md`.
- Always tell the user about such a discrepancy explicitly — which nodes differ and by how much — so they can confirm it with the designer. Never fold it silently into the implementation.

## Recurring blocks in the redesign

Decided after reviewing the home sections, the newsletter and search. **Status:** done (issue #25). The home sections, `search.vue` and `AppNewsletter` use `AppHeading`, `AppSectionIntro`, `AppLinkButton` and `AppButtonPrimary`; tests in `tests/unit/components/heading.test.ts`, `section-intro.test.ts`, `link-button.test.ts` and `button-primary.test.ts`. None of it has been checked in a browser yet. Don't hand-roll these blocks again; use the component, and update this section when one changes.

- **Serif display heading → `AppHeading`, not a new component.** `AppHeading` was the functional sans title (`text-3xl font-medium`) used by cart, checkout, order confirmation and `StoreCatalog`; that is still its default `variant="title"`, so those usages are unchanged. The title variant has `size` `md` (default, `text-3xl`) and `sm` (`text-lg`, the `StoreCatalog` heading, which used to pass `class="text-lg font-medium"` on top of `text-3xl`). `variant="display"` is the serif heading, with `size` and `tone` (types `TitleHeadingSize`, `DisplayHeadingSize`, `HeadingSize`, `SectionTone` in `app/types/ui.ts`; a size the variant doesn't have falls back to `md`):
  - `md` — `text-4xl md:text-[48px] leading-[1.05]` (categories, journal, new-arrivals, newsletter).
  - `lg` — `text-4xl md:text-[56px] leading-[1.05]` (studio-story, shop-the-look, search `h1`).
  - `hero` — `text-5xl sm:text-6xl lg:text-[88px] leading-[0.94]` (campaign `h1`).
  - `tone` is the section background, the same concept as in `AppSectionIntro`: `light` (default) gives `text-color-ink`, `dark` gives `text-color-paper` (shop-the-look).
- **Eyebrow + heading → `AppSectionIntro`** (`app/components/app/section-intro.vue`): `eyebrow`, optional `heading`, `as` (`h2` default, `h1` allowed), `size`, `tone: 'light' | 'dark'` (eyebrow `muted`/`sage`, heading `ink`/`paper`, lead `muted`/`sage`), a `heading` slot for heading markup the prop can't carry (the two-line headlines of studio-story and shop-the-look, a `<span class="block">` per line), and a default slot for a lead paragraph stacked under the heading (`text-[13px] leading-[1.7]`). Spacing is fixed: 12px (`gap-3`) from eyebrow to heading, 20px (`gap-3` + `mt-2`) from heading to lead — the newsletter design has 19px for both. Width goes through `class` on the component (layout only). It does not own the row layout: sections that put a link or description beside the intro (categories, new-arrivals, brands) keep that row themselves.
- **Underlined "text ↗" link → `AppLinkButton`** (brands, campaign, journal, studio-story, new-arrivals, `cart/empty.vue`): a neutral `variant="link"` `UButton` restyled to `gap-4 border-b border-color-ink pb-2 text-[13px] font-normal text-color-ink` with `trailing-icon="i-lucide-arrow-up-right"` at `size-4`. `to` is a path without the country prefix, like `AppLink`. Focus is an ink outline 2px outside the link (`focus-visible:outline-offset-2`, like the newsletter input) instead of the theme's inset ring, which would sit on top of the text with no padding. The hover state has no design; it keeps the old component's arrow turning 45°. The empty-cart link changed from the blue starter look to the ink underline.
- **Filled CTA with → → `AppButtonPrimary`** (campaign link, shop-the-look link with `inverted`, search submit, and the sign-in/register submits, which changed look with it): a neutral solid `UButton` at `h-12 gap-7 px-6 text-xs font-medium`, square, ink background with paper text, or paper background with ink text when `inverted` (dark sections). `trailing-icon` is passed through (`size-[18px]`); `to` is a path without the country prefix, like `AppLink`. Hover is the same color at 90% (no design). The hover, disabled/loading and focus-outline colors are all set in the component, otherwise the theme's `--ui-bg-inverted` (zinc-900) shows through in those states. The old `size` prop is gone: the look is fixed.
- **Status message after an action → `AppStatusMessage`** (`app/components/app/status-message.vue`). **Status:** done (issue #26). Every message after an action goes through it: `AppNewsletter` (validation error and success), the sign-in and register errors, and checkout's delivery, InPost picker, payment and review errors, with tests in `tests/unit/components/status-message.test.ts`. The old `AppFormError` (heroicons icon, size `xs`, raw `bg-red-50`/`text-red-500` that bypassed `--ui-error`) is deleted; sign-in and register now show the same soft error alert as checkout. Use `AppStatusMessage` for every new message, never a bare `UAlert`.
  - `type: 'error' | 'success' | 'warning' | 'info'` (`StatusType` in `app/types/ui.ts`) is passed as the `UAlert` color and picks a lucide icon (error keeps checkout's `i-lucide-alert-circle`); always `variant="soft"`, theme colors only, no palette overrides; `message` plus optional `description`.
  - It owns the screen-reader semantics: `role="alert"` for `error`, `role="status"` for the rest. A live region announces reliably only if it is already in the DOM when its content changes, so the component stays mounted and the caller passes `message: null` when there is nothing to show — never `v-if` the whole component, and keep it outside a `v-if`/`v-else` that swaps the content it reports on.
  - The always-mounted region is an empty `div` while there is no message, so it still counts as a flex item in a `gap-*` container: place it where that doesn't add space (the newsletter wraps it with the consent field). A caller's `class` is forwarded to the visible alert (`inheritAttrs: false`), so spacing like `mt-*`/`mb-*` applies only while a message is shown.
  - It exposes `focus()`. After a successful newsletter submit the form — with the submit button that had focus — is removed, so `onSubmit` focuses the success message after `nextTick()`.
  - Inline feedback under a single field is not an `AppStatusMessage` box. Fields inside `UFormField` already show their error as plain text (`mt-2 text-error-600`, see the next point). A field outside `UForm`, like the Stripe card element in `checkout/review/index.vue`, uses the same plain-text form, but it still needs an announcement. Keep a `role="alert"` region for the error and a `role="status"` region for success ("card complete") mounted at all times, and put the `v-if` on the text inside them. Use theme shades rather than raw palette colors: `text-error-600` / `text-success-700`, which follow `app.config` colors. `--ui-error` / `--ui-success` are the 500 shades, about 3.6:1 and 2.1:1 on `--color-paper`, below WCAG AA for small text.
- **Error text contrast → `ui.formField` in `app/app.config.ts`.** Nuxt UI's theme colors `UFormField`'s error text `text-(--ui-error)`, the 500 shade. That is about 3.6:1 on `--color-paper`, below WCAG AA. `app.config` sets the `error` slot to `text-error-600` (4.5:1), so every field error in every form changes without a per-form `:ui`. This was checked with `createTV()` against `.nuxt/ui/form-field.ts`: tailwind-merge drops the theme's color class, and a caller's `:ui="{ error: 'text-xs' }"` still applies. Use the same `error-600` for any other small error text: the required-field asterisk in `AppInput`/`AppInputPassword` (`aria-hidden="true"`, with `aria-required` on the input instead), the Stripe card error, and so on. Don't use raw `text-red-*`.
  - The newsletter's success state has no design (Figma shows only the form). It was chosen without one, at the user's request: the same soft `success` alert as everywhere else. Confirm it with the designer.
- **Checkbox look → `ui.checkbox` theme in `app/app.config.ts`** (applies to every `UCheckbox`, including checkout's "billing same as shipping"). Measured from the design (newsletter nodes `12:1858`, `12:1864`): 12px box, 1px border in the design's muted gray (the same `#66665e` as the "Interesuje mnie:" label), square corners, transparent fill. Implemented as `ring-(--ui-text-muted)` + `rounded-none` (the label next to it also uses `text-color-muted`). The default `--ui-border-accented` ring is nearly invisible on `--color-stone`, which is why the unchecked box "disappeared". The checked state has no design; chosen: `--color-ink` fill and 1px ring with a `--color-paper` check, instead of Nuxt UI's default 2px `--ui-bg-inverted` box.
- **Token gap:** the design's muted gray is `#66665e`, but `text-color-muted` maps to Nuxt UI's `--ui-text-muted` (zinc-500, `#71717b`). The code approximates the design's muted gray this way everywhere; it is not a project `--color-*` token yet.
- **Stays inside the newsletter** (one occurrence each, no component): the underlined email row with the inline submit, and the interest-checkbox label override. The inline "DOŁĄCZ →" submit is `UButton type="submit" variant="link" color="neutral" loading-auto trailing-icon="i-lucide-arrow-right"`: it gets the focus-visible ring, and `loading-auto` makes it pick up `UForm`'s submitting state (spinner, disabled against double submits).

## Figma MCP limits

- The Figma account is on the Starter plan, whose MCP call limit can be reached within a handful of calls in one session; once reached, every further Figma call fails for a while.
- Spend calls deliberately: `get_metadata` on a specific node, not the whole page — `0:1` returns ~83k characters and overflows the tool output. Take screenshots only when a visual comparison is actually needed, at a modest `maxDimension`.
- If the limit is hit, say so, state what you could not verify (e.g. "compared metadata only, no screenshot of the search variant"), and continue from what you already have.
- The limit does not reset with a new session: it was hit again on the very first call of a later session. Treat Figma as unavailable for long stretches, and keep the screenshots you already fetched — each one is saved as a PNG under the session's `tool-results` directory.
- Fallback for exact values without Figma: measure an already-fetched screenshot with `sharp` (installed in the project). A screenshot taken with `maxDimension` ≥ the node's width is 1:1, so crop and upscale it (`kernel: 'nearest'`) to look, then read raw pixels for exact colors, stroke width and corner radius. Anti-aliased half-pixel edges show up as a blend of the stroke and background colors; the full-strength pixel on the other axis is the real stroke color. This is how the checkbox border (`#66665e`, 1px, square) was measured.

## Reuse the design system

- Inspect existing Nuxt UI components, tokens, CSS variables, fonts, and component conventions first.
- Reuse existing tokens and components where appropriate. Avoid arbitrary one-off colors, spacing values, and duplicate button/input styles.
- Prefer semantic variants and small reusable components when repeated patterns justify them.
- Do not replace the design system or add a UI library just to implement one component.

## Responsive behavior

- Start with the narrow viewport and scale up.
- Check likely breakpoints and avoid overflow, clipped controls, awkward line breaks, and layout shifts.
- Ensure product grids, navigation, filters, dialogs, and checkout forms remain usable on touch devices.
- Consider long Polish and English strings; do not assume labels have a fixed length.

## Interaction states

- Implement hover, focus-visible, active, disabled, loading, empty, success, and error states where applicable.
- Use semantic HTML and native controls when possible.
- Preserve keyboard access and visible focus. Do not use color alone to communicate status.
- Give icon-only controls accessible names and meaningful images appropriate alternative text.
- A message that appears after an action (error, success, warning) must be announced to screen readers without moving focus (WCAG 4.1.3): `role="alert"` for errors, `role="status"` otherwise. `UAlert` renders a plain `div` with neither, so use `AppStatusMessage` (see "Recurring blocks in the redesign") rather than a bare `UAlert` or `<p>`.
- When an action removes the element that had focus (a form replaced by its success message), move focus to what replaced it; otherwise keyboard focus falls back to `<body>`.

## Visual verification

- Use available browser/screenshot tooling when it is configured.
- Compare the result at representative mobile and desktop sizes.
- Fix the most visible mismatches first: layout, sizing, typography, imagery, spacing, then small decorative details.
- Do not claim visual verification if you only inspected source code.
