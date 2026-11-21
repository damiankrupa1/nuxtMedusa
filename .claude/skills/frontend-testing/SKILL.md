---
name: frontend-testing
description: Choose and implement proportionate tests for Vue/Nuxt frontend changes. Use when adding behavior, fixing bugs, changing composables/state, or verifying critical storefront flows.
---

# Frontend Testing

## Discover the test setup

- Inspect package scripts, test configuration, existing tests, and installed dependencies first.
- Use the project's established runners and conventions: Vitest for unit and Nuxt-context tests, Playwright for real-browser e2e.
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
- Let Nuxt register `App*` and `U*` components in Nuxt tests; do not stub them just to make a component mount. Keep explicit stubs in the plain project when the component contract is not what the test covers. Mock repositories/services at external boundaries and keep all tests offline. In the Nuxt test app, only Nuxt UI and i18n are enabled; Sentry, image and sitemap modules are excluded. The Medusa plugin (`app/plugins/medusa.ts`) loads there; stub `fetch` if a test lets it call out.
- `pnpm test` runs both projects. Vitest's TypeScript checker stays scoped to plain unit tests through `tsconfig.test-unit.json`; `pnpm lint` covers both test trees. Run one file with `pnpm exec vitest run --project unit tests/unit/utils/product.test.ts` or `pnpm exec vitest run --project nuxt tests/nuxt/composables/cms.test.ts`.
- Vitest hoists `vi.mock()` calls. If a mock factory needs a value declared in the test file, create it with `vi.hoisted()`; otherwise keep mock factories self-contained. Use `mockNuxtImport()` for Nuxt auto-imports when the test needs to replace one, and use `registerEndpoint()` for same-origin fetch endpoints rather than a live service. The global Sentry mock in `tests/setup.ts` applies to the plain project; no unit or Nuxt test may call Medusa, Payload, Stripe or another live service.

## Server code (`server/utils`, `server/repository`, `server/api`)

- Nitro auto-imports h3 (`createError`, `isError`, `defineEventHandler`) into server code; unit tests do not. Assign the real ones from `h3` to `globalThis` in the test (see `tests/unit/server/validation.test.ts`, `handler.test.ts`), so status codes and `isError()` behave as in Nitro.
- A test that imports `h3` needs `// @vitest-environment node` at the top: under the default `jsdom` environment h3's `uncrypto` dependency resolves to its browser ESM build, so run those tests in Node.
- A repository in `server/repository` is tested with a fake `$fetch` assigned to `globalThis` (plus the real `createError`): assert the URL, query and options, that the body passes through, and the error mapping. Pass its configuration as an argument instead of stubbing `useRuntimeConfig` (see `tests/unit/server/payload.repository.test.ts`).
- A handler that uses a repository is tested with the repository mocked by `vi.mock('~~/server/repository/...')`: assert the statuses it owns (404, 503, 400) and what it passes on, not the upstream details (see `tests/unit/server/cms-route.test.ts`).
- A Medusa repository takes the request's SDK client as an argument; test it with a plain object of `vi.fn()`s cast to `Medusa` (`import type Medusa from '@medusajs/js-sdk'`) and Medusa failures as the SDK's `FetchError` (see `tests/unit/server/customer.repository.test.ts`). Where the SDK's own behaviour is the point (#82: which requests a login makes), build a real `new Medusa(buildServerMedusaConfig(...))` with the server's config and stub only the network with `vi.stubGlobal('fetch', ...)` in a `node` environment; Vitest then also fails on an unhandled rejection inside the SDK.
- The customer session routes (authentication, high risk) are tested one level higher on purpose: `tests/unit/server/customers-routes.test.ts` sends real requests through an h3 app with h3's own body and cookie helpers and fakes only the SDK client (`serverMedusaClient`, mocked with `vi.mock('~~/server/utils/medusa')`), so it pins the exact `Set-Cookie` header and the SDK calls across both layers. A request over https is simulated with the `x-forwarded-proto: https` header a TLS proxy adds (the `Secure` attribute depends on it), and h3's `getRequestProtocol` must be among the globals the test assigns. Extend it for any change to `server/api/customers/**` or `server/utils/session-cookie.ts`.
- Payload answers used by several tests are in `tests/fixtures/cms.ts` (one complete global per slug, with Payload's own ids and timestamps).

## Mounting components

- In the plain `unit` project, `@vue/test-utils`'s `mount` does not run Nuxt's auto-import/global component registration. Stub `App*` wrappers or Nuxt UI components (`UButton`, `UInput`, ...) explicitly when the plain test intentionally isolates the parent; otherwise put the test in `tests/nuxt/` and use `mountSuspended` so the real components, plugins and injections are present.
- In a plain mount, mock `$t` via `global.mocks` (`{ $t: (key: string) => key }`) whenever the component template calls it directly. In Nuxt tests, use the actual i18n plugin instead of a `$t` stub unless translation output itself is the boundary under test.

## E2E tests (Playwright)

Use `@nuxt/test-utils` only for Nuxt-context Vitest tests. Genuine browser e2e runs on `@playwright/test` (`pnpm test:e2e`, `tests/e2e/`), outside both Vitest projects. Add an e2e spec only for what no unit or Nuxt-project test can see: real navigation, hydration, cookies, headers, CORS and the production build's rules. Full detail is in "Test runner boundary" in `CLAUDE.md`; the rules that matter when writing a spec:

- Put it in `tests/e2e/specs/<area>/<topic>.spec.ts`, import `test`/`expect` from `~~/tests/e2e/support/fixtures` (not from `@playwright/test`) and use the `gotoHydrated` fixture before interacting. Helpers are plain functions in `tests/e2e/support/`; no page-object classes.
- No `waitForTimeout` (ESLint error) and no `networkidle`: assert on something observable. Select with `getByRole`/`getByLabel`/`getByText`, using copy from `i18n/locales/*.json` or from the Payload stub; add a `data-testid` (in its own commit) only when no semantic selector is stable. Don't select by Tailwind classes.
- Tag a spec that needs Medusa with `{ tag: '@medusa' }` (needs Stripe: `@stripe`). Untagged specs must pass with no backend at all; `playwright.config.ts` leaves tagged specs out while `E2E_MEDUSA_BACKEND_URL`/`E2E_STRIPE_KEY` is unset. Catalog handles come from `tests/e2e/support/test-data.ts`, never hard-coded in a spec; keep that file, the Payload stub and the Medusa e2e seed in sync.
- Each test makes its own data (its own cart, its own customer) so tests can run in parallel in any order. Don't depend on another test's state.
- Editorial content comes from the local Payload stub (`tests/e2e/support/payload-stub.ts`), which has no CORS headers on purpose; don't add them, and don't call Payload from a spec's page directly. Use `trackPayloadRequests(page)` to assert the browser only reaches it through `/api/cms`.
- Never use production services or keys: the run refuses a `pk_live_` key, production Medusa/Payload hosts and a Sentry DSN (`tests/e2e/support/safety.ts`, unit tested in `tests/unit/e2e/safety.test.ts`). Stripe is test mode only, InPost the sandbox.
- A regression spec must be shown to fail without the fix: revert the fix locally, run it, restore the fix (the #42 spec does, by changing `fetchGlobal()` back to a direct Payload call).
- Run one spec with `pnpm test:e2e tests/e2e/specs/seo/robots.spec.ts`. Every run rebuilds the app (about a minute); set `E2E_SKIP_BUILD=1` to reuse `.output` while you iterate on specs only, and rebuild after any change to `app/` or `server/`.

## Execution policy

- Run the narrowest relevant test first.
- Expand to typecheck/lint/build/full suite only when risk or scope warrants it.
- Do not run a test suite that is not configured or invent npm/pnpm scripts. Read the actual `package.json`.
- Report exact commands and outcomes. Clearly distinguish tests added, tests run, and tests not run.
