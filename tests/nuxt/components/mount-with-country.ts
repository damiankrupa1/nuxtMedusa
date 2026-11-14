import type { Component } from 'vue'
import { defineComponent, h } from 'vue'
import { useState } from 'nuxt/app'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { BaseRegionCountryWithRegionId } from '~/types/country'

export const mountWithCountry = (
  component: Component,
  props: Record<string, unknown>,
  slot: string,
  attrs: Record<string, unknown> = {},
) => {
  const Harness = defineComponent({
    setup() {
      useState<BaseRegionCountryWithRegionId | null>('country').value = {
        iso_2: 'pl',
        region_id: 'reg_pl',
      } as BaseRegionCountryWithRegionId

      return () => h(component, { ...props, ...attrs }, { default: () => slot })
    },
  })

  return mountSuspended(Harness)
}
