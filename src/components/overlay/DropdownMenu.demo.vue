<script setup lang="ts">
import type { MenuItem } from '../../vue'
import { ref } from 'vue'
import Button from '../button/Button.vue'
import DropdownMenu from './DropdownMenu.vue'

const items: MenuItem[] = [
  { value: 'rename', label: 'Rename' },
  { value: 'export', label: 'Export', children: [
    { value: 'markdown', label: 'Markdown' },
    { value: 'html', label: 'HTML' },
  ] },
  { value: 'share', label: 'Share', disabled: true },
  { value: 'archive', label: 'Archive', separatorBefore: true },
]
const selected = ref('No command selected')
</script>

<template>
  <div>
    <DropdownMenu
      label="Document actions"
      :items="items"
      @select="item => selected = item.label"
    >
      <template #trigger>
        <Button>Document actions</Button>
      </template>
    </DropdownMenu>
    <p aria-live="polite">
      {{ selected }}
    </p>
  </div>
</template>
