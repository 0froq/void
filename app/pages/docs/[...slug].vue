<script setup lang="ts">
// Product docs: the margin holds the table of contents, so the pen stays off these pages
const route = useRoute()
const { t, locale } = useI18n()
const link = useKitLink()
const contentPath = useContentPath()

const rest = computed(() => {
  const slug = route.params.slug
  const parts = Array.isArray(slug) ? slug : slug ? [slug] : []
  return parts.length ? `/${parts.join('/')}` : ''
})

const { data } = await useAsyncData(
  () => `docs-${locale.value}-${rest.value}`,
  async () => {
    const root = contentPath('/docs')
    const [doc, all] = await Promise.all([
      queryCollection('docs').path(`${root}${rest.value}`).first(),
      queryCollection('docs').where('path', 'LIKE', `${root}%`).order('stem', 'ASC').select('path', 'title').all(),
    ])
    return { doc, all, root }
  },
)
const doc = computed(() => data.value?.doc)
if (!doc.value)
  throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

const pages = computed(() => (data.value?.all ?? []).map(item => ({
  title: item.title,
  path: item.path,
  to: link(`/docs${item.path.slice(data.value?.root.length ?? 0)}`),
})))
const index = computed(() => pages.value.findIndex(item => item.path === doc.value?.path))
const prev = computed(() => pages.value[index.value - 1])
const next = computed(() => pages.value[index.value + 1])

useHead({ title: () => doc.value?.title })
const files = useRuntimeConfig().public.publicFiles
const override = computed(() => contentOgOverride(doc.value, 'docs', files))
if (override.value === undefined) {
  defineOgImage(ogComponentName(doc.value), {
    title: () => paperFields(doc.value).title,
    evergreen: () => paperFields(doc.value).evergreen,
    created: () => paperFields(doc.value).created,
    updated: () => paperFields(doc.value).updated,
    words: () => paperFields(doc.value).words,
    ...ogExtraProps(doc.value),
  }, {
    alt: () => paperFields(doc.value).title,
  })
}
useShareMeta({
  title: () => doc.value?.title,
  description: () => doc.value?.description,
  image: () => override.value === undefined ? false : override.value,
})
</script>

<template>
  <Sheet v-if="doc">
    <PageHead
      :title="doc.title"
      title-name="doc.title"
      :lede="doc.description"
      lede-name="doc.description"
      long
      compact
    >
      <template #kicker>
        <NuxtLink :to="link('/docs')">
          {{ t('docs.label') }}
        </NuxtLink>
      </template>
    </PageHead>
    <section class="l-section is-docs">
      <nav class="l-toc">
        <NuxtLink
          v-for="item in pages"
          :key="item.path"
          :to="item.to"
          :aria-current="item.path === doc.path ? 'page' : undefined"
        >
          <Fill
            :value="item.title"
            name="doc.title"
            :size="10"
          />
        </NuxtLink>
      </nav>
      <div class="l-body l-doc">
        <ContentRenderer
          :value="doc"
          class="l-md"
        />
      </div>
    </section>
    <nav class="l-section is-pager">
      <p class="l-label">
        <NuxtLink
          v-if="prev"
          :to="prev.to"
        >
          ← <Fill
            :value="prev.title"
            name="doc.title"
            :size="10"
          />
        </NuxtLink>
      </p>
      <NuxtLink
        v-if="next"
        class="l-body l-entry"
        :to="next.to"
      >
        <span class="l-kicker">{{ t('docs.next') }}</span>
        <span class="l-entry-title">
          <Fill
            :value="next.title"
            name="doc.title"
            :size="12"
          />
        </span>
      </NuxtLink>
    </nav>
  </Sheet>
</template>
