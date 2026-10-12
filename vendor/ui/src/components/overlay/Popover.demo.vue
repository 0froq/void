<script setup lang="ts">
import Button from '../button/Button.vue'
import Popover from './Popover.vue'
</script>

<template>
  <Popover
    label="Publication status"
    close-label="Close status"
  >
    <template #trigger>
      <Button>Publication status</Button>
    </template>
    <template #default="{ close }">
      <p>This document is still a draft.</p>
      <Button @click="close">
        Understood
      </Button>
    </template>
  </Popover>
</template>
