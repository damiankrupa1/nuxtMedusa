---
name: medusa-storefront
description: Implement and debug storefront functionality integrated with Medusa v2, including products, collections, regions, cart, checkout, shipping, and payments. Use for changes involving Medusa APIs or commerce flows.
---

# Medusa Storefront Integration

## Verify the installed version and existing integration

- Inspect `package.json`, the lockfile, the Medusa SDK/module configuration, runtime config, and existing API wrappers before coding.
- This project has used Medusa v2.19; confirm the installed version rather than assuming documentation or examples match.
- Prefer existing `@nuxtjs/medusa` or SDK usage patterns already in the repository. Do not mix incompatible SDK versions or copy v1 examples into a v2 project.
- Never invent endpoint names, request shapes, response fields, or provider configuration. Check installed types and version-matched documentation/source.

## Product data

- Account for region, currency, sales channel, publication status, pagination, and product variants as required by the existing implementation.
- Handle missing images, prices, variants, and optional product fields without crashing.
- Keep API response types accurate. Transform API data into view models at a clear boundary when helpful.
- Ensure localized content and slugs follow the project's i18n conventions for Polish and English.

## Cart and checkout

- Treat cart, shipping, payment, and order flows as high-risk.
- Follow the installed SDK's required sequencing and use the server as the authority for prices, inventory, shipping totals, discounts, and order state.
- Never trust client-supplied totals or treat a client-side success screen as proof of a completed payment/order.
- Prevent duplicate submissions in the UI where appropriate, but do not claim that a disabled button alone provides payment idempotency.
- Preserve cart identity and state according to the current Medusa integration; verify behavior after refresh and across navigation.
- Handle stale carts, unavailable variants, invalid addresses, failed shipping selection, and payment failures explicitly.
- Do not log access tokens, customer data, payment details, or secrets.

## Shipping and payment providers

- Inspect current provider IDs and configuration in the project before changing them. Do not assume provider identifiers from examples.
- Keep public client tokens distinct from server-side credentials.
- For InPost/geowidget or other browser SDKs, validate origin/configuration assumptions and provide useful error states.
- When a provider operation or order-creation sequence can fail midway, describe the boundary and verify backend responsibilities rather than inventing frontend-only fixes.

## Verification

- For product display changes, prefer a focused product/list/detail check.
- For cart or checkout changes, test the affected sequence and relevant failure states.
- Use the repository's actual scripts. Do not run full integration/E2E suites by default for unrelated UI edits.
