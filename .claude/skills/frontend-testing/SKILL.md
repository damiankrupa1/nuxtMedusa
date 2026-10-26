---
name: frontend-testing
description: Choose and implement proportionate tests for Vue/Nuxt frontend changes. Use when adding behavior, fixing bugs, changing composables/state, or verifying critical storefront flows.
---

# Frontend Testing

## Discover the test setup

- Inspect package scripts, test configuration, existing tests, and installed dependencies first.
- Use the project's established runner and conventions (for example, Vitest or Playwright only if actually configured).
- Do not install a testing framework without discussing it when the project has none.

## Match tests to risk

- Pure formatting or copy change: usually no new test; inspect the diff and validate only if useful.
- Component behavior: test the user-visible behavior and important states.
- Composable/domain logic: test meaningful inputs, outputs, and edge cases.
- API integration: test mapping, loading/error handling, and empty/malformed responses as appropriate.
- Cart/checkout/payment: test the critical happy path and important failure/duplicate-action paths at the layer the repository can reliably test.
- Bug fix: add a regression test when practical and proportionate.

## Test quality

- Assert observable behavior rather than implementation details.
- Cover boundaries and failure states, not only the happy path.
- Keep tests deterministic; avoid real external services unless the test is explicitly an integration test.
- Mock at the boundary, not every internal function.
- Avoid snapshots as the only evidence for complex behavior.

## Mounting components that use Nuxt UI or `app/` wrapper children

- `@vue/test-utils`'s `mount` in a Jest unit test does not run Nuxt's auto-import/global component registration. Any `app/components/app/*.vue` wrapper (e.g. `AppIconButton`) or Nuxt UI component (`UButton`, `UInput`, ...) rendered by the component under test must be stubbed explicitly in `global.stubs`, or it resolves as an unknown element and `wrapper.find(...)` silently finds nothing (e.g. a stub-less `<AppIconButton>` wrapping `<UButton>` never renders an actual `<button>`).
- Mock `$t` via `global.mocks` (`{ $t: (key: string) => key }`) whenever the component under test calls it directly in its template — without it, mounting throws `_ctx.$t is not a function`. See `tests/unit/components/product-price.test.ts` and `tests/unit/components/input-password.test.ts` for the pattern.

## Execution policy

- Run the narrowest relevant test first.
- Expand to typecheck/lint/build/full suite only when risk or scope warrants it.
- Do not run a test suite that is not configured or invent npm/pnpm scripts. Read the actual `package.json`.
- Report exact commands and outcomes. Clearly distinguish tests added, tests run, and tests not run.
