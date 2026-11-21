import type { Page } from '@playwright/test'

// Records what went wrong in the page itself: uncaught exceptions, console
// errors (Vue's hydration mismatch report among them) and images the browser
// could not load. Call it before the navigation it should observe and assert
// `errors()` is empty at the end, so a page that renders "fine" while
// throwing in the background (a product without a thumbnail, #45) fails.
export function trackPageErrors(page: Page) {
  const errors: string[] = []

  page.on('pageerror', (error) => {
    errors.push(`uncaught: ${error.message}`)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`)
    }
  })
  page.on('response', (response) => {
    if (response.request().resourceType() === 'image' && !response.ok()) {
      errors.push(`image ${response.status()}: ${response.url()}`)
    }
  })
  page.on('requestfailed', (request) => {
    if (request.resourceType() === 'image') {
      errors.push(
        `image failed: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`,
      )
    }
  })

  return {
    errors: () => [...errors],
  }
}
