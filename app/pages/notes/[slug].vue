<script setup lang="ts">
const route = useRoute()
const { t, locale } = useI18n()
const link = useKitLink()
const contentPath = useContentPath()
const slug = computed(() => String(route.params.slug))

const { data } = await useAsyncData(
  () => `note-${locale.value}-${slug.value}`,
  async () => {
    const [note, all] = await Promise.all([
      queryCollection('notes').path(contentPath(`/notes/${slug.value}`)).first(),
      queryCollection('notes').where('path', 'LIKE', `${contentPath('/notes')}/%`).order('date', 'DESC').select('path', 'title').all(),
    ])
    const index = all.findIndex(item => item.path === note?.path)
    const next = all.length > 1 ? all[(index + 1) % all.length] : undefined
    return { note, next }
  },
)
const note = computed(() => data.value?.note)
if (!note.value)
  throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

const next = computed(() => data.value?.next)
const toNote = (path: string): string => link(`/notes/${path.split('/').pop()}`)

useHead({ title: () => note.value?.title })
useShareMeta({
  title: () => note.value?.title,
  description: () => note.value?.description,
  type: 'article',
  cover: () => contentCoverSource('notes', note.value),
})
</script>

<template>
  <Sheet v-if="note">
    <PageHead
      :title="note.title"
      title-name="note.title"
      long
    >
      <template #kicker>
        <NuxtLink :to="link('/notes')">
          {{ t('notes.label') }}
        </NuxtLink>
      </template>
      <template #meta>
        {{ note.date }} · {{ t('notes.minutes', { n: readingMinutes(note.body) }) }}
      </template>
    </PageHead>
    <section class="l-section is-prose">
      <div class="l-body l-prose">
        <p
          v-if="note.description != null"
          class="l-excerpt"
        >
          <Fill
            :value="note.description"
            name="note.description"
            :size="24"
          />
        </p>
        <ContentRenderer
          :value="note"
          class="l-md"
        />
      </div>
    </section>
    <nav class="l-section is-pager">
      <p class="l-label">
        <NuxtLink :to="link('/notes')">
          ← {{ t('notes.back') }}
        </NuxtLink>
      </p>
      <NuxtLink
        v-if="next"
        class="l-body l-entry"
        :to="toNote(next.path)"
      >
        <span class="l-kicker">{{ t('notes.next') }}</span>
        <span class="l-entry-title">
          <Fill
            :value="next.title"
            name="note.title"
            :size="12"
          />
        </span>
      </NuxtLink>
    </nav>
  </Sheet>
</template>
