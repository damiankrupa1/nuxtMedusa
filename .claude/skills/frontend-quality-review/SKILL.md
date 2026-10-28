---
name: frontend-quality-review
description: Review frontend changes for correctness, maintainability, accessibility, security, and regressions. Use before finishing non-trivial frontend work or when asked to review code.
---

# Frontend Quality Review

## Review the actual diff

- Inspect changed files and relevant surrounding code; do not review only the summary.
- Prioritize concrete defects and regressions over subjective preferences.
- Preserve unrelated user changes. Do not silently modify files during a review-only task.

## Review checklist

### Correctness

- Are loading, empty, error, and success states handled?
- Are async operations and promises handled correctly?
- Can stale or missing data break the UI?
- Are types accurate and unsafe casts justified?

### Vue/Nuxt

- Could this cause SSR errors, hydration mismatch, duplicate fetching, or reactive loops?
- Are composables used in valid Nuxt/Vue contexts?
- Are props/emits and keys correct?
- Is shared state actually necessary?

### Accessibility

- Is semantic HTML used?
- Can controls be reached and operated by keyboard?
- Are labels, accessible names, focus states, and error messages present?
- Is contrast/status communication adequate, without relying on color alone?
- Consider WCAG 2.2 AA where applicable.

### Security and privacy

- Are secrets or privileged credentials exposed to client code?
- Is untrusted content rendered safely?
- Are URL parameters, user input, and external links handled safely?
- Are personal/customer/payment details absent from logs?
- Do not treat CORS as authentication or authorization.

### Maintainability

- Is the change focused?
- Is logic duplicated or unnecessarily abstracted?
- Were dependencies added without need?
- Are naming and repository conventions followed?

## Findings format

- List findings first, ordered by severity: critical, high, medium, low.
- Include file and line references when available, explain impact, and suggest a concrete fix.
- Separate confirmed defects from risks or suggestions.
- If no significant issues are found, say so and mention the scope reviewed.
- Do not claim tests, builds, browser checks, or accessibility audits were run unless they were.
