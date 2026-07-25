export function apiRepository() {
  const client = useMedusaClient()

  async function request<T>(promise: Promise<T>): Promise<T> {
    try {
      return await promise
    } catch (error) {
      handleError(error)
      throw error
    }
  }

  function handleError(error: unknown) {
    console.error('[API ERROR]', error) // TODO: Replace with proper error handling logic
  }

  return {
    client,
    request,
  }
}
