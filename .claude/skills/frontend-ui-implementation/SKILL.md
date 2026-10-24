---
name: frontend-ui-implementation
description: Implement polished, responsive storefront UI from a design, screenshot, Figma reference, or written requirements. Use for layout, styling, component, and design-system work.
---

# Frontend UI Implementation

## Understand the reference
- Identify the intended hierarchy, spacing, typography, colors, image ratios, responsive behavior, and interactive states before coding.
- If a screenshot/reference is supplied, reproduce its structure and visual priorities rather than inventing a different design.
- If Figma/browser inspection tools are unavailable, state the limitation and work from the available reference; do not claim pixel-perfect verification without visual comparison.

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
