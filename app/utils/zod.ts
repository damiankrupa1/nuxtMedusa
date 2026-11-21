import { z } from 'zod'

// zod for every schema in app/ (`import { z } from '~/utils/zod'`, never
// straight from 'zod').
//
// zod 4 compiles object parsers with `new Function` and, to find out whether
// it may, calls `Function('')` once, when the first z.object() is created.
// The Content-Security-Policy-Report-Only has no 'unsafe-eval' (#90,
// server/utils/content-security-policy.ts), so in the browser that probe is a
// violation on every page, reported even though zod catches it; once the
// policy is enforced it still would be. `jitless` skips both the probe and the
// compiled parsers (the interpreted ones are fast enough for our forms and CMS
// globals). It has to be set before the first schema exists, and a plugin is
// too late (the chunk with the schemas is evaluated before the app's entry),
// so it is set here, by the module every schema module imports first. The
// server has no CSP and keeps the compiled parsers.
if (import.meta.client) {
  z.config({ jitless: true })
}

export { z }
