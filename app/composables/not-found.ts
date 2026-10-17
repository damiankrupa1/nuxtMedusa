import type { Ref } from 'vue'
import type { AsyncDataRequestStatus } from '#app'

// A page whose handle matches nothing answers 404 instead of rendering empty,
// both on the server and once lazy data arrives after client-side navigation
export const useNotFoundWhenMissing = (
  data: Ref<unknown>,
  status: Ref<AsyncDataRequestStatus>,
  statusMessage: string,
) => {
  watch(
    () => status.value === 'success' && !data.value,
    (missing) => {
      if (missing) showError({ statusCode: 404, statusMessage })
    },
    { immediate: true },
  )
}
