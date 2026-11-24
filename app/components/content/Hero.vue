<script setup lang="ts">
// The wordmark, the handwritten line and the first call to action. The pen starts on its rule.
const props = withDefaults(
  defineProps<{
    tagline?: string | null
    lede?: string | null
    /** Link the latest changelog entry. */
    release?: boolean
    cta?: boolean
  }>(),
  { tagline: null, lede: null, release: true, cta: true },
)

const { product } = useAppConfig()
const { locale } = useI18n()
const contentPath = useContentPath()
const link = useKitLink()

const { data: latest } = await useAsyncData(
  () => `latest-release-${locale.value}`,
  () =>
    props.release
      ? queryCollection('changelog')
          .where('path', 'LIKE', `${contentPath('/changelog')}/%`)
          .order('date', 'DESC')
          .first()
      : Promise.resolve(null),
)

// Long names shrink so the word always fits the width
const length = computed(() => Math.max(3, [...(product.name || 'name')].length))
</script>

<template>
  <section class="l-hero">
    <h1
      class="l-word"
      :style="{ '--len': length }"
      :aria-label="product.name ? `${product.name}${product.mark}` : undefined"
    >
      <span data-anchor="word"
        ><Fill
          :value="product.name"
          name="product.name"
          :size="4" /></span
      ><span
        class="l-mark"
        data-anchor="mark"
        >{{ product.mark }}</span
      >
    </h1>
    <div
      class="l-hero-foot"
      data-anchor="rule"
    >
      <p
        class="l-tagline"
        data-anchor="tagline"
        lang="en"
      >
        <Fill
          :value="tagline"
          name="hero.tagline"
          :size="10"
        />
      </p>
      <NuxtLink
        v-if="latest"
        class="l-release"
        :to="link('/changelog')"
      >
        <span
          ><Fill
            :value="latest.version"
            name="changelog.version"
            :size="6"
        /></span>
        <Fill
          :value="latest.title"
          name="changelog.title"
          :size="12"
        />
      </NuxtLink>
      <p class="l-lede">
        <Fill
          :value="lede"
          name="hero.lede"
          :size="40"
        />
      </p>
      <InstallLink
        v-if="cta"
        class="l-cta"
      />
    </div>
  </section>
</template>
