<script setup lang="ts">
const { product } = useAppConfig()
const { t, locale, locales } = useI18n()
const link = useKitLink()
const switchLocalePath = useSwitchLocalePath()
const { theme, ready, toggle } = useTheme()
const others = computed(() => locales.value.filter(l => l.code !== locale.value))
const next = computed(() => (theme.value === 'dark' ? 'light' : 'dark'))
</script>

<template>
  <footer class="l-foot">
    <span
      ><Copy
        k="site.footer"
        :size="24"
    /></span>
    <nav class="l-nav">
      <NuxtLink
        v-for="item in product.footer"
        :key="item.to"
        :to="link(item.to)"
      >
        {{ t(item.label) }}
      </NuxtLink>
    </nav>
    <span class="l-controls">
      <NuxtLink
        v-for="l in others"
        :key="l.code"
        :to="switchLocalePath(l.code)"
        :lang="l.language"
        >{{ l.name }}</NuxtLink
      >
      <!-- The stored theme is only known on the client -->
      <button
        v-if="ready"
        type="button"
        @click="toggle"
        >{{ t(`theme.${next}`) }}</button
      >
    </span>
  </footer>
</template>
