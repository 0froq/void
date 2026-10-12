<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const link = useSiteLink()

useHead({ title: () => t('notFound.title') })
</script>

<template>
  <NuxtLayout>
    <div class="l-sheet">
      <PageHead
        :kicker="String(error.statusCode ?? 404)"
        :title="t('notFound.title')"
        :lede="error.statusMessage || error.message"
        long
      >
        <template #meta>
          <NuxtLink
            class="l-cta"
            :to="link('/')"
            @click.prevent="clearError({ redirect: link('/') })"
          >
            {{ t('notFound.back') }}
          </NuxtLink>
        </template>
      </PageHead>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.l-sheet {
  position: relative;
  z-index: 0;
}
</style>
