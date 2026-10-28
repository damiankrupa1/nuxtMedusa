---
name: frontend-task-workflow
description: Plan and execute frontend tasks with risk-based validation and minimal unnecessary checks. Use when implementing, debugging, refactoring, or reviewing frontend changes in this repository.
---

# Frontend Task Workflow

## Goal

Deliver the smallest correct change, with validation proportional to risk. Do not turn every task into a full-project verification run.

## Before editing

1. Inspect the relevant files, nearby patterns, package scripts, and current git diff.
2. Restate the task briefly and identify likely affected areas.
3. Classify risk:
   - **Low:** copy, styling, isolated presentational component, safe refactor with no behavior change.
   - **Medium:** composable, API mapping, shared state, routing, localization, product listing/detail behavior.
   - **High:** cart, checkout, payment, order creation, inventory, authentication, customer data, security, deployment/configuration.
4. For non-trivial work, provide a concise plan before editing. Ask a question only if a missing decision blocks safe implementation; otherwise state a reasonable assumption.
5. Identify the narrowest useful validation command from the actual `package.json` scripts and workspace. Never invent script names.

## Implementation

- Follow existing repository conventions unless they are clearly broken.
- Prefer a focused change over unrelated cleanup.
- Do not add dependencies, new abstractions, or broad refactors without a concrete need.
- Preserve unrelated user changes. Never revert or overwrite them.
- Do not edit generated files or lockfiles manually.

## Validation policy

Choose checks based on changed files and risk:

- Low risk: inspect the diff; run a targeted check only if useful.
- Medium risk: run the relevant lint, typecheck, or focused test.
- High risk: run focused tests plus the relevant broader checks available in the repository.
- Run a full build or full test suite only when the scope warrants it, when a release is being prepared, or when a targeted check cannot provide enough confidence.
- If a command is slow, expensive, or likely to trigger unrelated checks, explain why before running it and agree on it with the user when practical.
- Do not run the same check repeatedly if no relevant code changed since the last successful run.

## Before finishing

1. Review `git diff` for accidental changes, dead code, secrets, and scope creep.
2. Report: what changed, checks actually run and their results, and checks not run.
3. Never claim a test/build passed unless it was actually executed and passed.
