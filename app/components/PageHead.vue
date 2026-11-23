<script setup lang="ts">
// Head of an inner page: a large title whose stop blooms, over a ruled line the pen draws
withDefaults(
  defineProps<{
    kicker?: string | null
    kickerName?: string
    title?: string | null
    titleName?: string
    lede?: string | null
    ledeName?: string
    long?: boolean
    /** A shorter head for reference pages, where the content should start above the fold. */
    compact?: boolean
  }>(),
  {
    kicker: null,
    kickerName: 'kicker',
    title: null,
    titleName: 'title',
    lede: null,
    ledeName: 'lede',
  },
)
</script>

<template>
  <section
    class="l-page-head"
    :class="{ 'is-compact': compact }"
  >
    <h1
      class="l-page-title"
      :class="{ 'is-long': long }"
    >
      <Stop
        :text="title"
        :name="titleName"
        fallback="."
        :size="long ? 12 : 5"
      />
    </h1>
    <div
      class="l-page-foot"
      data-anchor="rule"
    >
      <p class="l-kicker">
        <slot name="kicker">
          <Fill
            :value="kicker"
            :name="kickerName"
            :size="8"
          />
        </slot>
      </p>
      <p
        v-if="lede != null"
        class="l-lede"
      >
        <Fill
          :value="lede"
          :name="ledeName"
          :size="28"
        />
      </p>
      <p
        v-if="$slots.meta"
        class="l-meta"
      >
        <slot name="meta" />
      </p>
    </div>
  </section>
</template>
