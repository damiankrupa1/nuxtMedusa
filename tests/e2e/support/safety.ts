// The e2e suite must never reach production data or report to production
// monitoring. These checks run when playwright.config.ts loads, before a build
// or a browser starts, and refuse with every reason at once.

// Substrings of the hostnames the live Medusa and Payload deployments use.
// Extend this list when another production host appears.
export const PRODUCTION_HOST_MARKERS = [
  'medusademo-production',
  'payload-cms-production',
]

// Variables that, when set in the shell that starts the suite, mean the person
// running it has production-grade monitoring or release credentials around.
// The suite overrides all of them with empty values for the app it builds, but
// refuses to start anyway so nobody assumes they are in effect.
const AMBIENT_SENTRY_VARIABLES = [
  'NUXT_PUBLIC_SENTRY_DSN',
  'SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
]

const URL_VARIABLES = [
  'NUXT_PUBLIC_MEDUSA_BACKEND_URL',
  'MEDUSA_URL',
  'NUXT_PUBLIC_PAYLOAD_URL',
  'NUXT_PUBLIC_PAYLOAD_IMAGE_HOSTS',
  'NUXT_PUBLIC_SITE_URL',
]

type Environment = Record<string, string | undefined>

// Returns one message per problem; an empty list means the environment is safe.
// `appEnv` is what the suite passes to `nuxt build` and `nuxt preview`,
// `ambient` is the environment of the process that starts Playwright.
export function findUnsafeE2eEnvironment(
  appEnv: Environment,
  ambient: Environment = {},
): string[] {
  const problems: string[] = []

  if (appEnv.NUXT_PUBLIC_STRIPE_KEY?.startsWith('pk_live_')) {
    problems.push(
      'E2E_STRIPE_KEY is a live Stripe key (pk_live_...). Use a pk_test_ key.',
    )
  }

  URL_VARIABLES.forEach((name) => {
    const value = appEnv[name]?.toLowerCase() ?? ''
    const marker = PRODUCTION_HOST_MARKERS.find((host) => value.includes(host))
    if (marker) {
      problems.push(
        `${name} points at a production host (contains "${marker}"). The e2e suite only runs against local, ephemeral or staging services.`,
      )
    }
  })

  if (appEnv.NUXT_PUBLIC_SENTRY_DSN) {
    problems.push(
      'NUXT_PUBLIC_SENTRY_DSN must be empty in the e2e build: the DSN is baked into the client bundle and test errors would reach the real Sentry project.',
    )
  }

  AMBIENT_SENTRY_VARIABLES.forEach((name) => {
    if (ambient[name]) {
      problems.push(
        `${name} is set in the environment that starts the e2e run. Unset it for this run (the suite builds the app with it empty).`,
      )
    }
  })

  return problems
}

export function assertSafeE2eEnvironment(
  appEnv: Environment,
  ambient: Environment = {},
): void {
  const problems = findUnsafeE2eEnvironment(appEnv, ambient)
  if (problems.length > 0) {
    throw new Error(
      `Refusing to start the e2e suite:\n${problems.map((problem) => `- ${problem}`).join('\n')}`,
    )
  }
}
