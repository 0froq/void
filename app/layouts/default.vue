<script setup lang="ts">
const { product } = useAppConfig()
const { t } = useI18n()
const installed = useInstalled()

// `inert` off must be absent, not "false"
const hidden = computed(() => installed.value || undefined)

function onKey(event: KeyboardEvent): void {
  if (event.key === 'Escape')
    installed.value = false
}

onMounted(() => {
  addEventListener('keydown', onKey)
  watch(installed, on => document.documentElement.classList.toggle('is-installed', on), { immediate: true })
})
onBeforeUnmount(() => removeEventListener('keydown', onKey))
</script>

<template>
  <Paper class="l-site">
    <a
      class="l-skip"
      href="#main"
    >{{ t('site.skip') }}</a>
    <SiteHeader :inert="hidden" />
    <main
      id="main"
      :inert="hidden"
    >
      <slot />
    </main>
    <SiteFooter :inert="hidden" />
    <Installed v-if="!product.install.href" />
  </Paper>
</template>
