import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  readonly,
  ref,
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
