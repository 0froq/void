<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const copy = useCopy()
const link = useKitLink()
const { product } = useAppConfig()

useHead({
  style: [{ key: 'theme', innerHTML: () => themeStyle(product.theme) }],
  title: () => copy('notFound.title'),
})
useShareMeta({
  title: () => copy('notFound.title'),
  description: () => copy('notFound.lede'),
})
</script>

<template>
  <NuxtLayout>
    <Sheet>
      <PageHead
        :kicker="String(props.error.statusCode ?? 404)"
        :title="copy('notFound.title')"
        title-name="notFound.title"
        :lede="copy('notFound.lede')"
        lede-name="notFound.lede"
        long
      >
        <template #meta>
          <NuxtLink
            class="l-cta"
            :to="link('/')"
            @click.prevent="clearError({ redirect: link('/') })"
          >
            {{ copy('notFound.back') }}
          </NuxtLink>
        </template>
      </PageHead>
    </Sheet>
  </NuxtLayout>
</template>
