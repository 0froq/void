<script setup lang="ts">
// Any page in content/<locale>/, including the landing (index.md): its blocks are the page
const route = useRoute()
const { locale, t } = useI18n()
const contentPath = useContentPath()

const rest = computed(() => {
  const slug = route.params.slug
  const parts = Array.isArray(slug) ? slug : slug ? [slug] : []
  return parts.length ? `/${parts.join('/')}` : '/'
})

const { data: page } = await useAsyncData(
  () => `page-${locale.value}-${rest.value}`,
  () => queryCollection('pages').path(contentPath(rest.value)).first(),
)
if (!page.value)
  throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

useHead(() => ({
  title: page.value?.title || undefined,
  // A filled landing title is the whole document title. An empty one falls through to the site title.
  titleTemplate: page.value?.head || !page.value?.title ? undefined : '%s',
}))
const files = useRuntimeConfig().public.publicFiles
const override = computed(() => contentOgOverride(page.value, 'pages', files))
if (override.value === undefined) {
  defineOgImage(ogComponentName(page.value), {
    title: () => paperFields(page.value).title,
    description: () => paperFields(page.value, t('site.description')).description,
    evergreen: () => paperFields(page.value).evergreen,
    created: () => paperFields(page.value).created,
    updated: () => paperFields(page.value).updated,
    words: () => paperFields(page.value).words,
    ...ogExtraProps(page.value),
  }, {
    alt: () => paperFields(page.value).title,
  })
}
useShareMeta({
  title: () => page.value?.title,
  description: () => page.value?.description,
  image: () => override.value === undefined ? false : override.value,
})
</script>

<template>
  <Sheet
    v-if="page"
    :line="page.line"
  >
    <PageHead
      v-if="page.head"
      :kicker="page.kicker"
      kicker-name="kicker"
      :title="page.title"
      title-name="title"
      :lede="page.description"
      lede-name="description"
    />
    <ContentRenderer
      :value="page"
      class="l-page l-md"
    />
  </Sheet>
</template>
