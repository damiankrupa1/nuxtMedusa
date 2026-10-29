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

## Vitest projects

- Keep plain tests in `tests/unit/**/*.test.ts`: the `unit` project runs in jsdom without booting Nuxt and loads `tests/setup.ts`. Use it for pure utilities, schemas, services and server helpers.
- Put tests that need real Nuxt composables, middleware, auto-imports, plugins/injections or app-wide component registration in `tests/nuxt/**/*.test.ts`. The `nuxt` project uses `@nuxt/test-utils`' `environment: 'nuxt'`; use `mountSuspended` for components and invoke composables/middleware from a component's setup so Nuxt context is active. Use generated Nuxt imports only when needed; component source can keep its normal `~/` alias.
- Let Nuxt register `App*` and `U*` components in Nuxt tests; do not stub them just to make a component mount. Keep explicit stubs in the plain project when the component contract is not what the test covers. Mock repositories/services at external boundaries and keep all tests offline. In the Nuxt test app, only Nuxt UI and i18n are enabled; Medusa, Sentry, image and sitemap modules are excluded.
- `pnpm test` runs both projects. Vitest's TypeScript checker stays scoped to plain unit tests through `tsconfig.test-unit.json`; `pnpm lint` covers both test trees. Run one file with `pnpm exec vitest run --project unit tests/unit/utils/product.test.ts` or `pnpm exec vitest run --project nuxt tests/nuxt/composables/cms.test.ts`.
- Vitest hoists `vi.mock()` calls. If a mock factory needs a value declared in the test file, create it with `vi.hoisted()`; otherwise keep mock factories self-contained. Use `mockNuxtImport()` for Nuxt auto-imports when the test needs to replace one, and use `registerEndpoint()` for same-origin fetch endpoints rather than a live service. The global Sentry mock in `tests/setup.ts` applies to the plain project; no unit or Nuxt test may call Medusa, Payload, Stripe or another live service.

## Server code (`server/utils`)

- Nitro auto-imports h3 (`createError`, `isError`, `defineEventHandler`) into server code; unit tests do not. Assign the real ones from `h3` to `globalThis` in the test (see `tests/unit/server/validation.test.ts`, `handler.test.ts`), so status codes and `isError()` behave as in Nitro.
- A test that imports `h3` needs `// @vitest-environment node` at the top: under the default `jsdom` environment h3's `uncrypto` dependency resolves to its browser ESM build, so run those tests in Node.
- Payload answers used by several tests are in `tests/fixtures/cms.ts` (one complete global per slug, with Payload's own ids and timestamps).

## Mounting components

- In the plain `unit` project, `@vue/test-utils`'s `mount` does not run Nuxt's auto-import/global component registration. Stub `App*` wrappers or Nuxt UI components (`UButton`, `UInput`, ...) explicitly when the plain test intentionally isolates the parent; otherwise put the test in `tests/nuxt/` and use `mountSuspended` so the real components, plugins and injections are present.
- In a plain mount, mock `$t` via `global.mocks` (`{ $t: (key: string) => key }`) whenever the component template calls it directly. In Nuxt tests, use the actual i18n plugin instead of a `$t` stub unless translation output itself is the boundary under test.

## E2E runner decision

Use `@nuxt/test-utils` only for Nuxt-context Vitest tests. If issue #45 is resumed, choose Playwright for genuine browser e2e: it provides the intended multi-browser matrix, traces and independent server lifecycle. This decision does not start an e2e suite; keep e2e tests outside both Vitest projects.

## Execution policy

- Run the narrowest relevant test first.
- Expand to typecheck/lint/build/full suite only when risk or scope warrants it.
- Do not run a test suite that is not configured or invent npm/pnpm scripts. Read the actual `package.json`.
- Report exact commands and outcomes. Clearly distinguish tests added, tests run, and tests not run.
