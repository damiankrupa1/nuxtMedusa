export function apiRepository() {
  const client = useMedusaClient()

  async function request<T>(promise: Promise<T>): Promise<T> {
    try {
      return await promise
    } catch (error) {
      captureError(error, { source: 'medusa' })
      throw error
    }
  }

  return {
    client,
    request,
  }
}
