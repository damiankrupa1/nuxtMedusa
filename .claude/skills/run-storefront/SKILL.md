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

1. Run the existing `pnpm dev` script from the repository root, but in a **new, visible OS terminal window** — never via the Bash/PowerShell tool's own background execution (`run_in_background`), since that output isn't visible to the user. On Windows, use the PowerShell tool to spawn a separate window that stays open after the command exits or errors:
   ```powershell
   Start-Process powershell -ArgumentList '-NoExit','-Command','pnpm dev' -WorkingDirectory '<repo root>'
   ```
   (`-NoExit` keeps the window open so the user can keep reading logs, including after a crash.)
2. Because the server now runs in its own window outside Claude Code's process tree, its output is not captured automatically. Tell the user which window to watch, and ask them to read back Nuxt's ready message and the local URL (default `http://localhost:3000/`, but Nuxt may pick a different port if it's occupied) — do not assume the port or claim the app is running without that confirmation.
3. If the port is already occupied, Nuxt will report the alternate port it picked in that window. Do not terminate other processes to free a port.
4. If startup fails, ask the user to paste the error from the terminal window, then report the relevant cause and suggest a targeted next step. Do not hide failures, change dependencies, or edit environment files without the user's approval.

## Troubleshooting

- For missing dependencies, run `pnpm install` and retry once.
- For a missing or incomplete environment file, explain which variable names are required based on `.env.template`; never include their values in output.
- For backend connection failures, verify the configured backend URL and whether the Medusa service is running. Do not invent endpoint paths or modify backend configuration.
- Do not claim the app is running unless the user confirms Nuxt's ready message from the visible terminal window.
- The dev server window is owned by the user, not by Claude Code's process tree — don't close it or kill its process yourself; ask the user to close the window or stop the process if that's needed.
