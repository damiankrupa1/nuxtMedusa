---
name: run-storefront
description: 'Run or troubleshoot the Nuxt storefront locally. Use when starting the development server, opening the app, checking local prerequisites, or diagnosing startup failures.'
---

# Run the Storefront Locally

## Before starting

1. Read the project `CLAUDE.md`, `README.md`, and `package.json` for current requirements and scripts.
2. Check that Node.js is version 22 or newer and pnpm is version 9 or newer.
3. If dependencies are not installed, run `pnpm install`. Do not install or update individual packages just to start the app.
4. Check whether `.env` exists without displaying or copying its contents. If it is missing, tell the user to create it from `.env.template` and configure the Medusa backend URL and publishable key. Never print secrets or commit `.env`.
5. The storefront expects a running Medusa backend. Check its configured URL and availability without exposing environment values. If the backend is unavailable, explain that the Nuxt server can still start but commerce data and flows may not work.

## Start the development server

1. Run the existing `pnpm dev` script from the repository root.
2. Keep the server process running while the user is using the app. Wait for Nuxt's ready message and report the exact local URL it prints; do not assume the port if Nuxt selects another one.
3. If the port is already occupied, use the alternate port reported by Nuxt. Do not terminate other processes to free a port.
4. If startup fails, report the relevant error and suggest a targeted next step. Do not hide failures, change dependencies, or edit environment files without the user's approval.

## Troubleshooting

- For missing dependencies, run `pnpm install` and retry once.
- For a missing or incomplete environment file, explain which variable names are required based on `.env.template`; never include their values in output.
- For backend connection failures, verify the configured backend URL and whether the Medusa service is running. Do not invent endpoint paths or modify backend configuration.
- Do not claim the app is running unless Nuxt reports that the server is ready.
- Do not stop a running process unless it was started for this task and stopping it is necessary or the user asks.
