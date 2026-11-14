import type { Page } from '@playwright/test'
import { payloadStubUrl } from '~~/tests/e2e/support/env'

export interface FailedRequest {
  url: string
  error: string
}

const isApiCall = (resourceType: string) =>
  resourceType === 'fetch' || resourceType === 'xhr'

// Records what the page's own JavaScript requests from hosts it must not call
// itself. Only fetch/XHR count: an <img> can legitimately point at another
// host (Payload's media), an API call cannot (CORS).
//
// Call it before the navigation it should observe. `requests()` is every
// watched call, `failures()` the ones the browser could not complete, which is
// what a CORS block looks like.
export function trackBrowserRequests(
  page: Page,
  isWatchedUrl: (url: URL) => boolean,
) {
  const requests: string[] = []
  const failures: FailedRequest[] = []
  const isWatched = (url: string, resourceType: string) =>
    isApiCall(resourceType) && isWatchedUrl(new URL(url))

  page.on('request', (request) => {
    if (isWatched(request.url(), request.resourceType())) {
      requests.push(request.url())
    }
  })
  page.on('requestfailed', (request) => {
    if (isWatched(request.url(), request.resourceType())) {
      failures.push({
        url: request.url(),
        error: request.failure()?.errorText ?? 'unknown',
      })
    }
  })

  return {
    requests: () => [...requests],
    failures: () => [...failures],
  }
}

// The browser must reach Payload only through the storefront's own /api/cms
// proxy (#42), never directly.
export function trackPayloadRequests(page: Page) {
  const payloadHost = new URL(payloadStubUrl).host
  return trackBrowserRequests(page, (url) => url.host === payloadHost)
}
