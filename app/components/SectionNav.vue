<script setup lang="ts">
import type { PageSection } from '~/composables/usePageSections'

defineProps<{ sections: PageSection[]; current: string }>()
const { t } = useI18n()
</script>

<template>
  <nav
    class="l-sections"
    :aria-label="t('nav.sections')"
  >
    <a
      v-for="section in sections"
      :key="section.id"
      :href="`#${section.id}`"
      :aria-current="section.id === current ? 'true' : undefined"
      >{{ section.label }}</a
    >
  </nav>
</template>
