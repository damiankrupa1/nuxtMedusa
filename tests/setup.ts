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

import { captureError } from '../app/utils/capture-error'
import { formatInpostPointAddress } from '../app/utils/inpost'
import {
  getStripePaymentMethod,
  toStripeBillingDetails,
} from '../app/utils/payment'
import { getPercentageDiff } from '../app/utils/percentage-diff'

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
