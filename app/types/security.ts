// A header policy written as data (server/utils/security-headers.ts, #90):
// feature or directive name -> its allowlist or sources. Serialised in the
// order the keys are listed.
export type HeaderPolicy = Record<string, readonly string[]>

// The parts of the runtime config the Content-Security-Policy-Report-Only is
// built from (server/utils/content-security-policy.ts). `csp` is private
// (server only): NUXT_CSP_REPORT_URI and NUXT_CSP_IMG_SRC at runtime, and
// `payloadImageHosts`, baked in at build time from
// NUXT_PUBLIC_PAYLOAD_IMAGE_HOSTS like @nuxt/image's allow-list.
export interface SecurityHeadersRuntimeConfigInput {
  csp?: {
    reportUri?: string
    imgSrc?: string
    payloadImageHosts?: string
  }
  public: {
    medusa?: { backendUrl?: string }
    payloadUrl?: string
    sentry?: { dsn?: string }
  }
}
