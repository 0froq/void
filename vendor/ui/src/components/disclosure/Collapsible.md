---
title: Collapsible
designStatus: ai-draft
description: A controlled disclosure with a persistent, accessible panel.
model:
  type: boolean
  default: "false"
  description: Whether the panel is open.
props:
  - name: label
    type: string
    required: true
    description: Text for the built-in trigger. A custom trigger slot supplies its own content.
  - name: disabled
    type: boolean
    default: "false"
    description: Prevent user-triggered toggling.
slots:
  - name: trigger
    description: Receives open and props (CollapsibleTriggerProps); bind all props to the trigger button.
  - name: default
    description: Panel content; receives the current open boolean and remains mounted while closed.
---

Collapsible is a controlled disclosure: `v-model` is a boolean, and the default is closed. Its native button supports Enter and Space. When the panel closes while focus is inside it, focus returns to the trigger. The panel remains mounted and is marked `hidden`, `inert`, and `aria-hidden` while closed. Keep this in mind for default-slot content with lifecycle hooks or other side effects.

The `disabled` prop prevents user toggles; it does not prevent a parent from changing the model. If you provide a trigger slot, bind its complete `props` object to the real button to preserve its generated `id`, `type`, `disabled`, ARIA attributes, class, and click handler. The panel's generated ID is connected to that trigger through `aria-controls`.

Collapsible does not animate panel height; only the chevron rotates, and reduced-motion preferences disable that transition. It does not implement Accordion or automatic group behavior. Content and any business state remain the consumer's responsibility.

## Usage

```vue
<script setup lang="ts">
import { Collapsible } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <Collapsible
      v-model="open"
      label="Installation details"
    >
      <template #trigger="{ open: isOpen, props }">
        <button v-bind="props">
          {{ isOpen ? 'Hide' : 'Show' }} installation details
        </button>
      </template>
      <template #default="{ open: isOpen }">
        <p>{{ isOpen ? 'Panel is open.' : 'Panel is closed.' }}</p>
        <button
          type="button"
          @click="open = false"
        >
          Close from inside
        </button>
      </template>
    </Collapsible>
  </div>
</template>
```

The shared unstyled behavior is available as `useDisclosure(open, disabled?)` from `@froq/ui/vue`. It returns `toggle(event?)`, which ignores calls when disabled or when the event is already default-prevented.
