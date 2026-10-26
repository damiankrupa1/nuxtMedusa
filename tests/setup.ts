import {
  computed,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  readonly,
  ref,
  useId,
  watch,
} from 'vue'

import { captureError } from '~/utils/capture-error'
import { formatInpostPointAddress } from '~/utils/inpost'
import {
  getStripePaymentMethod,
  toStripeBillingDetails,
} from '~/utils/payment'
import { getPercentageDiff } from '~/utils/percentage-diff'

Object.assign(globalThis, {
  formatInpostPointAddress,
  computed,
  inject,
  useId,
  // Stand-in for Nuxt UI's auto-imported key (UFormField provides its input
  // id under it); tests provide the same symbol to mimic a field.
  inputIdInjectionKey: Symbol('nuxt-ui.input-id'),
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  readonly,
  ref,
  watch,
  getPercentageDiff,
  getStripePaymentMethod,
  captureError,
  toStripeBillingDetails,
})
