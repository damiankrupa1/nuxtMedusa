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
- Both screens end with the same stack: "Shopping assurances" → "Newsletter signup" → "Footer", implemented as `AppBenefitsBar` + `AppNewsletter` at page level and `AppFooter` in the default layout.
- There are no designs for product detail, cart, checkout, account or order pages. Say so instead of inventing a layout, and ask before adding design-only sections (like the newsletter) there.

## Design inconsistencies between screens

- When the same section differs slightly between screens (e.g. "Newsletter signup" is 340px tall with 72px top padding on home but 324px/64px on search; "Shopping assurances" is 127px vs 111px), treat it as a design error, not an intentional variant: reuse the one component unchanged. Don't add size props or variants just to match each screen pixel-perfectly.
- Always tell the user about such a discrepancy explicitly — which nodes differ and by how much — so they can confirm it with the designer. Never fold it silently into the implementation.

## Figma MCP limits

- The Figma account is on the Starter plan, whose MCP call limit can be reached within a handful of calls in one session; once reached, every further Figma call fails for a while.
- Spend calls deliberately: `get_metadata` on a specific node, not the whole page — `0:1` returns ~83k characters and overflows the tool output. Take screenshots only when a visual comparison is actually needed, at a modest `maxDimension`.
- If the limit is hit, say so, state what you could not verify (e.g. "compared metadata only, no screenshot of the search variant"), and continue from what you already have.

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

## Visual verification

- Use available browser/screenshot tooling when it is configured.
- Compare the result at representative mobile and desktop sizes.
- Fix the most visible mismatches first: layout, sizing, typography, imagery, spacing, then small decorative details.
- Do not claim visual verification if you only inspected source code.
