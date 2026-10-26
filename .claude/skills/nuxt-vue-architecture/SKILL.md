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

## Native element vs Nuxt UI component vs small wrapper

- Reach for the Nuxt UI component (`UButton`, `UInput`, `UForm`, ...) when the control participates in form validation, loading/disabled state, or needs consistent focus-visible styling — that wiring runs through `useFormField()`/form injection and is easy to get right once centrally, easy to silently regress by hand in every form.
- A bare native element (`<button>`, `<input>`, `<form>`) is fine for a one-off control that is fully custom per design and has no validation/loading/error state to participate in (a tab switcher, a mobile-menu toggle, a cosmetic search-bar row). Forcing the Nuxt UI component there mostly means fighting its own opinionated base classes (padding, rounded, ring) for no behavioral gain.
- `UForm`'s own theme base is empty (`{ base: "" }`) — it never conflicts with custom styling, so use it (with a `zod` schema) whenever a form has real validation rules, even if its fields stay visually bespoke.
- `UFormField` only earns its keep when a child actually calls `useFormField()` (a Nuxt UI input component), which is what wires `aria-describedby`/`aria-invalid`/error-color/auto-disable-while-submitting. Wrapping a raw native `<input>`/`<label>` in `UFormField` for its scoped `error` alone adds a layer with no consumer — read the `errors` off `UForm`'s own default slot instead for that case (see the Volar gotcha below for how to bind it without a type error).
- When a visual pattern (icon-only toggle, primary CTA, link-with-icon, etc.) repeats 3+ times, extract a small `app/components/app/*.vue` wrapper around the Nuxt UI component (see `button-primary.vue`, `link-button.vue`, `icon-button.vue`, `form-error.vue`) rather than re-styling the Nuxt UI component inline every time, or building one catch-all "does everything" wrapper.
- Extract a repeated literal prop type (e.g. a shared size union) into `app/types/*.ts` once it is duplicated across 3+ components, following the existing `~/types/<domain>` import convention (see `app/types/ui.ts`).

## Focus-visible styling

- Never pair `focus:outline-none` on a custom-styled element without an explicit `focus-visible:*` replacement (ring/outline) — this silently breaks keyboard-focus visibility (WCAG 2.4.7) while looking fine to a mouse user, so it is easy to ship unnoticed.
- Nuxt UI's own theme does not apply this consistently either: `UButton`'s variants all get a `focus-visible:ring-*` compound class, but `UInput`'s `ghost`/`soft`/`none` variants currently do not. Check the actual rendered focus state for the specific variant/color you pick — don't assume a Nuxt UI component is accessible by default just because it's a shared component.

## Known TypeScript/Volar gotchas with `zod` + `UForm`

- This project is on `zod@^4`. Its string-format shorthand methods (`z.string().email()`, `.url()`, `.uuid()`, `.jwt()`, `.emoji()`, `.guid()`, ...) are deprecated in favor of top-level schema functions: use `z.email(message)`, `z.url(message)`, `z.uuid(message)`, etc. instead of chaining them off `z.string()`. The old chained form still compiles but is flagged deprecated by the type checker/IDE.
- `UForm`'s default slot is typed `default(props?: { errors: FormError[] })` — the optional `props?` means Volar/vue-tsc treats the slot-scope value as possibly `undefined`, so destructuring it directly in the template (`v-slot="{ errors }"`) throws `Property 'errors' does not exist on type '{ errors: FormError[] } | undefined'`. Bind the whole slot-scope object instead and read through it with optional chaining:
  ```vue
  <UForm v-slot="formSlot" :schema="schema" :state="state" @submit="onSubmit">
    ...
    <AppFormError :show="!!formSlot?.errors?.length" :message="formSlot?.errors?.[0]?.message" />
  </UForm>
  ```

## Responsibility boundaries

- Components should primarily render UI and coordinate user interactions.
- Put reusable stateful view logic in composables.
- Put business rules in focused services/domain functions when they are reused or non-trivial.
- Use Pinia only when state is genuinely shared or needs store semantics; do not move every local state variable into a global store.
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
