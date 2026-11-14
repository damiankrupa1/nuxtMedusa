import { defineConfig, devices } from '@playwright/test'
import {
  allBrowsers,
  appEnv,
  appUrl,
  hasMedusa,
  hasStripe,
  skipBuild,
} from '~~/tests/e2e/support/env'
import { assertSafeE2eEnvironment } from '~~/tests/e2e/support/safety'

// Real-browser e2e suite (see "Test runner boundary" in CLAUDE.md). It tests
// the production build served by `nuxt preview`, because the CDN-cache and SSR
// route rules only apply there, not in `nuxt dev`. Specs live in
// tests/e2e/specs; helpers in tests/e2e/support.
assertSafeE2eEnvironment(appEnv, process.env)

const isCi = !!process.env.CI

// Specs that need a backend are tagged and left out while it isn't configured,
// so the run still passes with the backend-free part of the suite.
const missingBackends = [
  ...(hasMedusa ? [] : ['@medusa']),
  ...(hasStripe ? [] : ['@stripe']),
]

export default defineConfig({
  testDir: 'tests/e2e/specs',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: isCi,
  // Retries only on CI. A test that passes on retry is reported as flaky by
  // the reporters (and the trace of its first failure is kept), not hidden.
  retries: isCi ? 1 : 0,
  workers: isCi ? 2 : undefined,
  reporter: isCi
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  grepInvert:
    missingBackends.length > 0
      ? new RegExp(missingBackends.join('|'))
      : undefined,

  use: {
    baseURL: appUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(allBrowsers
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],

  webServer: {
    // The build happens here, with the e2e environment, so there is one place
    // that decides what the app under test is built with. E2E_SKIP_BUILD=1
    // reuses an existing .output for quick local iterations.
    command: skipBuild ? 'pnpm preview' : 'pnpm build && pnpm preview',
    // robots.txt is answered by the app itself, no backend involved
    url: `${appUrl}/robots.txt`,
    env: appEnv,
    reuseExistingServer: false,
    timeout: 10 * 60 * 1000,
    // The build log is long; E2E_VERBOSE=1 shows it. Errors always show.
    stdout: process.env.E2E_VERBOSE === '1' ? 'pipe' : 'ignore',
    stderr: 'pipe',
  },
})
