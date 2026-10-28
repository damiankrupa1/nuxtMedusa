---
name: nuxt-vue-architecture
description: Apply consistent Nuxt 4, Vue 3, and TypeScript architecture in this storefront. Use when creating or modifying pages, components, composables, services, state, routing, or API integration.
---

# Nuxt + Vue Architecture

## First inspect the project

- Read the root `CLAUDE.md`, relevant package manifests, Nuxt configuration, and nearby implementations.
- Match the actual repository layout and conventions; do not assume a particular monorepo folder structure.
- Prefer existing utilities and module conventions over introducing a competing pattern.

## Nuxt and Vue

- Use Vue 3 Composition API and `<script setup lang="ts">` where consistent with nearby code.
- Use Nuxt conventions for pages, layouts, middleware, plugins, runtime config, and auto-imports.
- Keep server-only secrets and privileged credentials out of client bundles. Only intentionally public values belong in public runtime config.
- Respect SSR: avoid unguarded browser globals (`window`, `document`, `localStorage`) during server rendering. Use lifecycle hooks or client-only boundaries when needed.
- Avoid hydration mismatches and nondeterministic render output.
- Use `useAsyncData`/`useFetch` or the project's existing data-fetching layer consistently; avoid duplicate requests and unnecessary client-side refetches.
- Give components typed props and emits. Avoid `any`; use `unknown` and narrow it when the type is genuinely uncertain.

## `null` vs `undefined`

- Default to `null` for "intentionally no value" domain state: a lookup that found nothing, a cleared/reset field, an error slot that isn't currently set (`ref<string | null>(null)`, `computed(() => data.value?.customer ?? null)`). This already matches the codebase's own convention for by-handle repository lookups (see root `CLAUDE.md`) and most composable error state (e.g. `app/composables/customer.ts`) — `null` reads as "no value, on purpose."
- Reserve `undefined` for what is inherently `undefined` in JS/Vue/TS rather than something you're choosing: an optional prop that wasn't passed (`defineProps<{ x?: string }>()`), an omitted optional function argument, or a destructured field that may not exist on an object. Don't fight the language by forcing those to `null` — an optional prop's "not passed" state is natively `undefined`.
- Don't mix both for the same kind of "no value" within one composable/component. `app/composables/payment.ts` currently does both (`error`/`cardContainer` default to `null`; `cardElement`, `paidPaymentIntentId`, and `stripeMethod` use `undefined`) for state that is conceptually the same "nothing yet" — when touching a file like this, align it on `null` rather than copying whichever one happens to be nearby.

## Native element vs Nuxt UI component vs small wrapper

- Reach for the Nuxt UI component (`UButton`, `UInput`, `UForm`, ...) when the control participates in form validation, loading/disabled state, or needs consistent focus-visible styling — that wiring runs through `useFormField()`/form injection and is easy to get right once centrally, easy to silently regress by hand in every form.
- A bare native element (`<button>`, `<input>`, `<form>`) is fine for a one-off control that is fully custom per design and has no validation/loading/error state to participate in (a tab switcher, a mobile-menu toggle, a cosmetic search-bar row). Forcing the Nuxt UI component there mostly means fighting its own opinionated base classes (padding, rounded, ring) for no behavioral gain.
- `UForm`'s own theme base is empty (`{ base: "" }`) — it never conflicts with custom styling, so use it (with a `zod` schema) whenever a form has real validation rules, even if its fields stay visually bespoke.
- `UFormField` only earns its keep when a child actually calls `useFormField()` (a Nuxt UI input component), which is what wires `aria-describedby`/`aria-invalid`/error-color/auto-disable-while-submitting. Wrapping a raw native `<input>`/`<label>` in `UFormField` for its scoped `error` alone adds a layer with no consumer — read the `errors` off `UForm`'s own default slot instead for that case (see the Volar gotcha below for how to bind it without a type error).
- Checkboxes are `UCheckbox` — never `UInput type="checkbox"` (`UInput`'s theme is for text fields) and not a native `<input type="checkbox">` inside a `UForm`. Use `UCheckbox` for every checkbox in a form, validated or not, so they look and behave the same; a native checkbox also ignores Tailwind border/color classes because its `appearance` is not reset. Put a link inside the label through the `#label` slot.
- An app-wide default for a Nuxt UI component (e.g. every checkbox is `neutral`, because `primary` is blue and nothing in the design is) goes in `app/app.config.ts` under `ui.<component>.defaultVariants`, not as a repeated prop on each usage and not as a wrapper component. The same goes for an app-wide look: override the theme's `slots` and `compoundVariants` there (see `ui.checkbox`). Nuxt UI builds its classes with `tailwind-variants` + `tailwind-merge`, so a class set in `app.config` replaces the conflicting theme class (`rounded-none` beats `rounded-(--ui-radius)`, a later `ring-(…)` color beats the theme's); a theme-level change can be checked in Node with `createTV()` from `tailwind-variants` against `.nuxt/ui/<component>.ts`.
- When a visual pattern (icon-only toggle, primary CTA, link-with-icon, etc.) repeats 3+ times, extract a small `app/components/app/*.vue` wrapper around the Nuxt UI component (see `button-primary.vue`, `link-button.vue`, `icon-button.vue`, `status-message.vue`) rather than re-styling the Nuxt UI component inline every time, or building one catch-all "does everything" wrapper.
- A wrapper's look (size, weight, color, tone) is chosen through its props, never overridden through `class`. A plain `app/` component appends the caller's `class` to its own, so `<AppHeading class="text-lg font-medium">` (once in `app/components/store/catalog.vue`, now `size="sm"`) put `text-lg` and `text-3xl` on the same element and CSS order — not intent — decided which won. `class` on a wrapper is for layout only (margin, flex, width). For the heading variants see "Recurring blocks in the redesign" in `frontend-ui-implementation`.
- Extract a repeated literal prop type (e.g. a shared size union) into `app/types/*.ts` once it is duplicated across 3+ components, following the existing `~/types/<domain>` import convention (see `app/types/ui.ts`).

## Where a component lives

- A section used by exactly one page lives in that page's domain folder (e.g. `app/components/home/*.vue` → `HomeCampaign`, `HomeJournal`, each rendered once from `index.vue`).
- A section used — or designed — on more than one page lives in `app/components/app/` (e.g. `AppBenefitsBar`, `AppNewsletter`). Check the design's other screens, not just today's usages in code, before deciding something is page-specific. When a page-domain component gains a second page, move it (`git mv`) rather than importing `Home*` from another page.
- i18n keys follow the component's placement: `app.<component>.*` for shared components, `pages.<page>.*` for page sections. Moving a component to `app/` means moving its keys too (`pages.home.newsletter.*` → `app.newsletter.*`), in every locale file.
- Sections shared by several pages that sit outside the page content — the benefits bar + newsletter above the footer — are rendered by `app/layouts/default.vue` and switched on per page with `definePageMeta({ prefooter: true })` (home, search, store, category, collection). Don't repeat them in each page, and don't put them inside a content component like `StoreCatalog`, which can render conditionally (`search.vue` shows it only when there is a query).
  - Read the flag through Nuxt's `useRoute()` in the layout. There it returns `nuxtApp._route`, which updates on `page:finish` — after the new page has loaded — so the block doesn't appear or vanish under the old page during navigation. Don't use vue-router's own route there.
  - Rendered in the layout, the section is one instance for as long as consecutive pages keep the flag: a typed email or the "thanks" message survives home → store → category, and is lost when passing through a page without the flag or on reload.
- Prefer a page-meta flag in the existing layout over a new layout when only a section differs. Switching layouts remounts the whole layout, `AppHeader` included, on every navigation between them. A new layout is for a different page frame, like `checkout.vue` (checkout header, minimal footer).
- Don't enable `keepalive` to preserve a shared section's state. It caches whole pages per route key, client-side only, so it never shares one instance between pages; it also keeps entire catalog trees in memory and shows stale data unless the page refetches in `onActivated`.

## Internal links

- Link inside the store through `AppLink`/`AppLinkButton`, which add the country prefix. Never build `` `/${country.iso_2}/...` `` by hand: use `useCountryLink()` for a `UButton :to` and `toCountryLink(to, countryCode)` for `navigateTo` (see "Internal links" in root `CLAUDE.md`).
- A route with params (`products/[handle]`, `categories/[handle]`, `collections/[handle]`, `order/[orderId]/confirmed`) is linked as a named route without `countryCode` — `{ name: 'countryCode-categories-handle', params: { handle } }` — so `typedPages` checks the name and params. A static page (`/store`, `/cart`, `/account`) and every CMS-provided URL stay path strings.
- A computed link that is either form is typed `AppLinkTarget`; a prop that only takes a named route is `AppRoute` (both in `~/types/link`). Don't type them with `RouteLocationRaw` from `'vue-router'` — it doesn't carry the generated route names here.
- A page reads its params with the route name, `useRoute('countryCode-products-handle').params.handle`, not `route.params.handle as string`.

## Page meta

- Per-page configuration read by the layout, a plugin or middleware is declared in `definePageMeta` (route meta), never set in a store from the page's `setup`. A page's setup runs before the new page has loaded, so a store flag would switch the layout under the old page, and every page would have to reset it on leave. Current keys — keep this list up to date when adding one:
  - `cdnCache` — share the server render through the CDN cache (read by `app/plugins/cdn-cache.server.ts`, see root `CLAUDE.md`).
  - `prefooter` — show `AppBenefitsBar` + `AppNewsletter` above the footer (read by `app/layouts/default.vue`).
- These keys are untyped (`unknown`) and stay that way. Nuxt's documented `declare module '#app' { interface PageMeta { ... } }` does not reach `definePageMeta` or `route.meta` in this project (Nuxt 3.16, TypeScript 5.8, pnpm): `#app` only re-exports `PageMeta` through `export type` chains, and the augmentation never merges into the original in `nuxt/dist/pages/runtime/composables`. `declare module 'nuxt/app'` and the `node_modules/nuxt/...` path fail the same way. The only target that works is the pnpm-hashed real path, which stops working silently on the next dependency update. Even a working augmentation would not catch a misspelled key, because `PageMeta` has a `[key: string]: unknown` index signature. So read the flags by truthiness (`v-if="route.meta.prefooter"`), and re-check after the Nuxt 4 upgrade.

## Imports

- Import project files through a root alias, never a relative path (`./`, `../`) — including a sibling in the same folder (`./api.repository` → `~/repository/api.repository`). An aliased path reads the same from every file, survives moving the importing file, and can be grepped.
  - `~/` → `app/` (Nuxt `srcDir`): everything under `app/`, imported from `app/` or from `tests/` (Jest maps `~/` to `app/` as well).
  - `~~/` → project root: code outside `app/`, e.g. `~~/server/types/medusa-error` inside `server/`. Nuxt generates `~~/*` in `.nuxt/tsconfig.server.json`, so Nitro resolves it.
  - Module/virtual aliases (`#ui/types`, `#medusa/server`) stay as they are. Use `~/`, not `@/` — the repo uses `~/` only.
- Tests follow the same rule: `import Heading from '~/components/app/heading.vue'`, not `'../../../app/components/app/heading.vue'`. Jest maps `~~/` to the project root as well (`jest.config.cjs`), so a test imports server code as `~~/server/...`. ESLint (`no-restricted-imports`) rejects relative imports, but not dynamic `import()` — write those with an alias by hand.

## Where types live

- Every named `type`/`interface` lives in `app/types/<domain>.ts` and is imported with `import type { ... } from '~/types/<domain>'` — including types used by only one component. One simple rule beats a per-case judgment call. The only thing that stays inline is a component's own props/emits literal inside `defineProps<{ ... }>()` / `defineEmits<{ ... }>()`.
- A form type derived from a `zod` schema (`z.infer`) cannot move on its own, and hand-writing it next to the schema duplicates the shape. Move the schema with it: export a schema factory that takes `t` and the inferred type from the same file, as `app/types/filter.ts` already does for `SORT_OPTIONS` + `SortOptionsType`. Reference implementation: `app/types/newsletter.ts` (`buildNewsletterSchema`, `NewsletterForm`, `createNewsletterForm`) with its test in `tests/unit/types/newsletter.test.ts`. The component keeps only `const schema = computed(() => buildNewsletterSchema(t))`. A schema outside the component can be unit-tested in Jest directly, without mounting the component, stubbing Nuxt UI or mocking `$t`.
- When a server handler receives what the form submits, the form's schema is also the request schema — one definition per form. Make the factory's `t` optional (`t?.('validation.emailInvalid')`; without it zod keeps its own English messages) and export the server's instance next to it: `signinRequestSchema = buildSigninSchema()` in `app/types/customer.ts`, used by `server/api/customers/login.post.ts` through `parseRequestInput()` (see "Server API routes" in root `CLAUDE.md`). A request with no form (a query, route params, a profile update) still gets its schema in `app/types/<domain>.ts` (`app/types/catalog.ts`), derived from the form's schema where one exists (`.pick()`/`.partial()`) instead of restating its rules.

## Form state

- The `zod` schema is the single source of truth for a form's shape; its type comes from `z.infer`. Don't hand-write an interface that the schema then has to match (`satisfies z.ZodType<T>` only catches some drift), and don't model form state as a class — the codebase has no classes in `app/` or `server/`, and `UForm` hands `onSubmit` a plain object parsed by `zod` anyway, never a class instance.
- Every field the form collects belongs in the schema and in `state`, even one without validation rules (the newsletter's `interests`). A field kept in a separate `ref` is missing from `event.data` in `onSubmit` and gets silently dropped once a backend is wired.
- Initial state comes from a factory that returns a new object on every call — `reactive(createNewsletterForm())`. Never call `reactive()` on a shared module-level object: `reactive` wraps that same object instead of copying it, and returns the same proxy for it every time, so values typed into one form instance show up in every other instance and on the next page.

## Colors as tokens, not raw hex

- Never hardcode a raw hex value in a Tailwind arbitrary-value class (`bg-[#dcd4c7]`, `text-[#dbddd3]`). Add it as a CSS variable in `app/assets/css/variables.css`, map it under `@theme` and expose a `@utility` for it in `app/assets/css/main.css`, following the existing `--color-ink`/`--color-paper`/`--color-sand`/`--color-stone`/`--color-sage` pattern, then use the resulting `bg-color-*`/`text-color-*` utility.
- A `*-color-*` class only exists if `main.css` has its `@utility`; the `@theme` entry generates `bg-ink`/`border-ink`, not `bg-color-ink`. A missing one generates no CSS and no error: `bg-color-accent` (shop-the-look's panel) and `border-color-ink` (the underlined links) were used for a while without one. Add the `@utility` together with the first usage.
- This applies even to a color used only once today — a raw hex with no name is already a latent duplicate waiting to be pasted into the next component, and a design change then means grepping for hex strings across the codebase instead of editing one variable. Check for an existing close token first (e.g. `--color-sand` vs `--color-stone` are both muted beiges but are genuinely different shades — don't collapse distinct design colors into one token just to avoid adding a new one).

## Focus-visible styling

- Never pair `focus:outline-none` on a custom-styled element without an explicit `focus-visible:*` replacement (ring/outline) — this silently breaks keyboard-focus visibility (WCAG 2.4.7) while looking fine to a mouse user, so it is easy to ship unnoticed.
- Nuxt UI's own theme does not apply this consistently either: `UButton`'s variants all get a `focus-visible:ring-*` compound class, but `UInput`'s `ghost`/`soft`/`none` variants currently do not. Check the actual rendered focus state for the specific variant/color you pick — don't assume a Nuxt UI component is accessible by default just because it's a shared component.

## Known TypeScript/Volar gotchas with `zod` + `UForm`

- This project is on `zod@^4`. Its string-format shorthand methods (`z.string().email()`, `.url()`, `.uuid()`, `.jwt()`, `.emoji()`, `.guid()`, ...) are deprecated in favor of top-level schema functions: use `z.email(message)`, `z.url(message)`, `z.uuid(message)`, etc. instead of chaining them off `z.string()`. The old chained form still compiles but is flagged deprecated by the type checker/IDE.
- `UForm`'s default slot is typed `default(props?: { errors: FormError[] })` — the optional `props?` means Volar/vue-tsc treats the slot-scope value as possibly `undefined`, so destructuring it directly in the template (`v-slot="{ errors }"`) throws `Property 'errors' does not exist on type '{ errors: FormError[] } | undefined'`. Bind the whole slot-scope object instead and read through it with optional chaining:
  ```vue
  <UForm v-slot="formSlot" :schema="schema" :state="state" @submit="onSubmit">
    ...
    <AppStatusMessage type="error" :message="formSlot?.errors?.[0]?.message ?? null" />
  </UForm>
  ```

## Responsibility boundaries

- Components should primarily render UI and coordinate user interactions.
- Put reusable stateful view logic in composables.
- Put business rules in focused services/domain functions when they are reused or non-trivial.
- Pinia is not installed. Shared client state lives in a composable on Nuxt's `useState` (e.g. `isCartDropdownOpen` in `app/composables/cart.ts`), plus a cookie when it must survive a reload, read client-side only on CDN-cached pages; server data goes through `useLazyAsyncData`. Don't add Pinia for a per-page flag or a single shared value — propose it only for several related stores with actions and getters, and discuss the new dependency first.
- Introduce interfaces/adapters/repositories only when they isolate a real boundary (for example, an external API) or improve testability. Do not add layers mechanically.
- Use dependency injection when it improves replaceability or testing; do not replace simple construction with an elaborate DI system without a reason.
- Keep API DTOs separate from view models when transformations or domain semantics justify it.

## Errors and async state

- Handle loading, empty, success, and failure states where relevant.
- Do not swallow errors silently. Preserve useful context and use the project's established error handling.
- Avoid fire-and-forget promises unless intentional and safely handled.

## Maintainability

- Prefer explicit, readable code over clever abstractions.
- Keep functions cohesive and avoid unrelated edits.
- Follow the existing ESLint, Prettier, naming, import, and file organization rules.
- Add comments for non-obvious decisions, not for code that is self-explanatory.
