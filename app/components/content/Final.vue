<script setup lang="ts">
// The closing line. Its full stop is where the pen ends and the last colour lands.
withDefaults(
  defineProps<{
    id?: string
    title?: string | null
    /** Name drawn on the title block while `title` is empty. */
    titleName?: string
    lede?: string
    cta?: boolean
    /** A quieter sign-off for inner pages: smaller, no call to action. */
    end?: boolean
  }>(),
  { id: undefined, title: null, titleName: 'final.title', lede: undefined, cta: true },
)
</script>

<template>
  <section
    :id="id"
    class="l-final"
    :class="{ 'is-end': end }"
  >
    <h2
      class="l-final-title"
      data-anchor="final"
    >
      <Stop
        :text="title"
        :name="titleName"
        anchor="final-mark"
        :size="8"
      />
    </h2>
    <p
      v-if="lede != null"
      class="l-lede"
    >
      <Fill
        v-if="!isFilled(lede)"
        name="final.lede"
        :size="24"
      />
      <RichText
        v-else
        :text="lede"
      />
    </p>
    <slot />
    <InstallLink
      v-if="cta && !end"
      class="l-cta"
    />
  </section>
</template>
