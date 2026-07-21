import { computed, nextTick, onMounted, reactive, readonly, ref, watch } from 'vue'

import { getPercentageDiff } from '../app/utils/percentage-diff'

Object.assign(globalThis, {
  computed,
  nextTick,
  onMounted,
  reactive,
  readonly,
  ref,
  watch,
  getPercentageDiff,
})
