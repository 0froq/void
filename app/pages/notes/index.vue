<script setup lang="ts">
const { t, locale } = useI18n()
const copy = useCopy()
const link = useKitLink()
const contentPath = useContentPath()

const { data: notes } = await useAsyncData(
  () => `notes-${locale.value}`,
  () =>
    queryCollection('notes')
      .where('path', 'LIKE', `${contentPath('/notes')}/%`)
      .order('date', 'DESC')
      .all(),
)

const slug = (path: string): string => path.split('/').pop() ?? ''

useHead({ title: () => t('notes.label') })
const files = useRuntimeConfig().public.publicFiles
const override = computed(() =>
  explicitContentCover(
    {
      collection: 'notes',
      path: contentPath('/notes'),
    },
    path => hasShareFile(files, path),
  ),
)
if (!override.value) {
  defineOgImage(
    'Paper',
    {
      title: () => t('notes.label'),
      description: () => t('notes.lede') || t('site.description'),
      words: 0,
    },
    {
      alt: () => t('notes.label'),
    },
  )
}
useShareMeta({
  title: () => t('notes.label'),
  description: () => t('notes.lede'),
  image: () => override.value ?? false,
})
</script>

<template>
  <Sheet line>
    <PageHead
      :kicker="copy('notes.label')"
      kicker-name="notes.label"
      :title="copy('notes.title')"
      title-name="notes.title"
      :lede="copy('notes.lede')"
      lede-name="notes.lede"
    >
      <template #meta>
        {{ t('notes.count', { n: notes?.length ?? 0 }) }}
      </template>
    </PageHead>
    <Block
      v-for="note in notes"
      :key="note.path"
      :label="note.date"
      label-name="note.date"
      entry
    >
      <NuxtLink
        class="l-entry"
        :to="link(`/notes/${slug(note.path)}`)"
      >
        <h2 class="l-entry-title">
          <Fill
            :value="note.title"
            name="note.title"
            :size="16"
          />
        </h2>
        <p
          v-if="note.description != null"
          class="l-copy"
        >
          <Fill
            :value="note.description"
            name="note.description"
            :size="24"
          />
        </p>
        <span class="l-more"
          >{{ t('notes.read') }}
          <small>{{ t('notes.minutes', { n: readingMinutes(note.body) }) }}</small></span
        >
      </NuxtLink>
    </Block>
    <Final
      :title="copy('notes.end')"
      title-name="notes.end"
      end
    />
  </Sheet>
</template>
