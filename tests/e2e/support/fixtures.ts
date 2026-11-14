import { test as base, expect } from '@playwright/test'
import type { Page, Response } from '@playwright/test'

// Nuxt exposes `useNuxtApp` on `window` in the browser; `isHydrating` is true
// until the client has taken over the server-rendered page. Interacting before
// that (a click on a server-rendered button) can be lost, which makes tests
// flaky in a way no timeout fixes.
type WindowWithNuxt = Window & {
  useNuxtApp?: () => { isHydrating: boolean }
}

export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const nuxtApp = (window as WindowWithNuxt).useNuxtApp?.()
      return nuxtApp !== undefined && nuxtApp.isHydrating === false
    },
    undefined,
    { timeout: 30_000 },
  )
}

export const test = base.extend<{
  // page.goto() that also waits until the page is interactive
  gotoHydrated: (path: string) => Promise<Response | null>
}>({
  gotoHydrated: async ({ page }, use) => {
    await use(async (path) => {
      const response = await page.goto(path)
      await waitForHydration(page)
      return response
    })
  },
})

export { expect }
