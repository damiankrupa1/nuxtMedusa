// What the Sentry init files hand to buildSentryOptions(). The client reads it
// from runtimeConfig.public.sentry, the server from process.env (runtime
// config isn't available that early), so both are plain optional strings.
export interface SentryConfigInput {
  dsn?: string
  environment?: string
  release?: string
  // A string because it comes from an env var
  tracesSampleRate?: string | number
}
