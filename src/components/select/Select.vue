<script setup lang="ts">
import type { ChoiceOption } from '../../vue'
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  label: string
  options: ChoiceOption[]
  framed?: boolean
}>()

const model = defineModel<string>({ required: true })
const { wrapperAttrs, controlAttrs } = useControlAttrs()
</script>

<template>
  <label
    v-bind="wrapperAttrs()"
    class="ui-field"
  >
    <span class="ui-field-label">{{ label }}</span>
    <span class="ui-select-control">
      <select
        v-bind="controlAttrs()"
        v-model="model"
        class="ui-field-control ui-select"
        :class="{ 'is-framed': framed }"
      >
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      <svg
        class="ui-select-chevron"
        viewBox="0 0 12 8"
        aria-hidden="true"
        focusable="false"
      >
        <path d="m1 1 5 5 5-5" />
      </svg>
    </span>
  </label>
</template>
