// A header policy written as data (server/utils/security-headers.ts, #90):
// feature or directive name -> its allowlist or sources. Serialised in the
// order the keys are listed.
export type HeaderPolicy = Record<string, readonly string[]>
