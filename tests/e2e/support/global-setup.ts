import { payloadStubPort } from '~~/tests/e2e/support/env'
import { startPayloadStub } from '~~/tests/e2e/support/payload-stub'

// Playwright starts the preview server (webServer) first, then runs this.
// The app only talks to the stub when a request needs a CMS global, so the
// order doesn't matter. The returned function stops the stub after the run.
export default async function globalSetup() {
  const stub = await startPayloadStub(payloadStubPort)
  return stub.close
}
