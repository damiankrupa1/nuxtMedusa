import { computed, nextTick, onMounted, reactive, readonly, ref, watch } from 'vue'

import { formatInpostPointAddress } from '../app/utils/inpost'
import { getPercentageDiff } from '../app/utils/percentage-diff'

Object.assign(globalThis, {
  formatInpostPointAddress,
  computed,
  nextTick,
  onMounted,
  reactive,
  readonly,
  ref,
  watch,
  getPercentageDiff,
})
