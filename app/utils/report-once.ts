// Keys already reported in this server instance (or, in the browser, this page
// load). For a failure that repeats on every render or navigation until
// someone fixes its cause, so that one broken thing can't flood the error
// monitoring with identical events.
const reported = new Set<string>()

/** `true` the first time a key is seen, `false` for every repeat. */
export function shouldReportOnce(key: string): boolean {
  if (reported.has(key)) {
    return false
  }
  reported.add(key)
  return true
}

/** Forgets every key; for tests, which share this module state. */
export function resetReportedOnce() {
  reported.clear()
}
