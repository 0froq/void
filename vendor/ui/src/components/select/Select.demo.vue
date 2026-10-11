<script setup lang="ts">
import type { ChoiceOption } from '../../vue'
import { ref } from 'vue'
import Select from './Select.vue'

const options: ChoiceOption[] = [
  { value: 'quiet', label: 'Quiet' },
  { value: 'plain', label: 'Plain' },
  { value: 'loud', label: 'Loud' },
]

const tone = ref('plain')
</script>

<template>
  <Select
    v-model="tone"
    label="Tone"
    :options="options"
  />
  <Select
    v-model="tone"
    label="Framed tone"
    :options="options"
    framed
  />
  <p class="demo-readout">
    {{ tone }}
  </p>
</template>
