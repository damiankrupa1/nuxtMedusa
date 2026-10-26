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
