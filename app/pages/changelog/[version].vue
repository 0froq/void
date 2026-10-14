<script setup lang="ts">
const route = useRoute()
const { t, locale } = useI18n()
const link = useKitLink()
const contentPath = useContentPath()
const version = computed(() => String(route.params.version))

const { data: release } = await useAsyncData(
  () => `changelog-${locale.value}-${version.value}`,
  () => queryCollection('changelog').path(contentPath(`/changelog/${version.value}`)).first(),
)
if (!release.value)
  throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

useHead({ title: () => release.value?.title })
const files = useRuntimeConfig().public.publicFiles
const override = computed(() => contentOgOverride(release.value, 'changelog', files))
if (override.value === undefined) {
  defineOgImage(ogComponentName(release.value), {
    title: () => paperFields(release.value).title,
    evergreen: () => paperFields(release.value).evergreen,
    created: () => paperFields(release.value).created,
    updated: () => paperFields(release.value).updated,
    words: () => paperFields(release.value).words,
    ...ogExtraProps(release.value),
  }, {
    alt: () => paperFields(release.value).title,
  })
}
useShareMeta({
  title: () => release.value?.title,
  description: () => release.value?.description,
  type: 'article',
  image: () => override.value === undefined ? false : override.value,
})
</script>

<template>
  <Sheet v-if="release">
    <PageHead
      :title="release.title"
      title-name="changelog.title"
      long
    >
      <template #kicker>
        <NuxtLink :to="link('/changelog')">
          {{ t('changelog.label') }}
        </NuxtLink>
      </template>
      <template #meta>
        {{ release.version }} · {{ release.date }}
      </template>
    </PageHead>
    <section class="l-section is-prose">
      <ContentRenderer
        :value="release"
        class="l-md"
      />
    </section>
  </Sheet>
</template>
