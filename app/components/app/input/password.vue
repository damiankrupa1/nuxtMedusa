<script lang="ts" setup>
import type { UiSize } from '~/types/ui'

defineProps<{
  modelValue: string | undefined
  name: string
  placeholder?: string
  autocomplete?: string
  required?: boolean
  label: string
  size?: UiSize
}>()

const passwordVisible = ref(false)
const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="relative">
    <UInput
      :model-value="modelValue"
      :type="passwordVisible ? 'text' : 'password'"
      :placeholder="placeholder || ''"
      :name="name"
      :autocomplete="autocomplete"
      :aria-required="required || undefined"
      :size="size || 'xl'"
      :ui="{ base: 'peer' }"
      class="w-full"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <label
        class="pointer-events-none py-1 absolute left-0 -top-2.5 text-[var(--ui-text-highlighted)] text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-[var(--ui-text-highlighted)] peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-[var(--ui-text-dimmed)] peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal"
      >
        <span class="inline-flex bg-[var(--ui-bg)] px-1">
          {{ label
          }}<span v-if="required" aria-hidden="true" class="text-error-600"
            >*</span
          >
        </span>
      </label>
    </UInput>
    <AppIconButton
      :icon="passwordVisible ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
      :label="$t('app.input.password.toggleVisibility')"
      class="absolute inset-y-0 right-3 z-10"
      @click="togglePasswordVisibility"
    />
  </div>
</template>
