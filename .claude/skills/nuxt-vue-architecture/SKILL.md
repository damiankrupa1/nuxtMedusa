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
