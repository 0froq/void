<script setup lang="ts">
// 1200×630 paper card. Front face of the IssuePeekCard (serif title,
// evergreen label, mono meta) plus the froQ mark, fully inside, bottom right.
// No hover, flip, or tilt. Title color is `--ui-fg`.
//
// Takumi, not Satori. Latin faces are unicode-range slices and Han is the
// chinese-simplified subset; Takumi walks that fallback chain and reads woff2.
// Satori does not read woff2, and one family name keeps a single slice, so a
// Han title loses the rest of its glyphs.

const props = withDefaults(defineProps<{
  title?: string
  evergreen?: boolean | string
  created?: string
  updated?: string
  words?: number | string
}>(), {
  title: 'void',
  evergreen: false,
  created: '',
  updated: '',
  words: 0,
})

const DATE_RE = /(\d{4})-(\d{2})-(\d{2})/

const fg = '#1a1917'
const serif = '"Instrument Serif", "Noto Serif SC", serif'
const mono = '"Geist Mono", ui-monospace, monospace'

function formatCardDate(value?: string): string {
  if (!value?.trim())
    return ''
  const match = DATE_RE.exec(value)
  if (!match)
    return value.trim()
  return `${match[1]}/${match[2]}/${match[3]}`
}

function dateStamp(value?: string): string {
  return value?.match(DATE_RE)?.slice(1, 4).join('') ?? ''
}

function formatCompact(n: number): string {
  return new Intl.NumberFormat('en', {
    notation: n >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(n)
}

const showEvergreen = computed(() => props.evergreen === true || props.evergreen === 'true')

const wordCount = computed(() => {
  const value = typeof props.words === 'string' ? Number(props.words) : props.words
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
})

const meta = computed(() => {
  const bits: string[] = []
  const created = formatCardDate(props.created)
  if (created)
    bits.push(created)
  if (showEvergreen.value) {
    const updated = formatCardDate(props.updated)
    const sameDay = dateStamp(props.updated) !== '' && dateStamp(props.updated) === dateStamp(props.created)
    if (updated && !sameDay)
      bits.push(updated)
  }
  if (wordCount.value > 0)
    bits.push(`${formatCompact(wordCount.value)} words`)
  return bits
})

const rootStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  backgroundColor: '#f4f2ec',
  border: '2px solid rgba(26, 25, 23, 0.12)',
  boxSizing: 'border-box',
  padding: '72px 80px 64px',
  position: 'relative',
  overflow: 'hidden',
} as const

// Instrument Serif italic 400, the same face the old satori card used for froQ.
// nuxt-og-image loads an italic file only when the template contains
// `font-style: italic` or the class `italic`. `fontStyle` in this object is not scanned,
// so the mark also carries that CSS literally. Without the file, Takumi slants the roman.
const markStyle = {
  position: 'absolute',
  right: '56px',
  bottom: '40px',
  display: 'flex',
  fontFamily: serif,
  fontStyle: 'italic',
  fontWeight: 400,
  fontSize: '200px',
  lineHeight: 1,
  letterSpacing: '-0.04em',
  color: 'rgba(26, 25, 23, 0.11)',
} as const

const titleStyle = {
  display: 'block',
  width: '760px',
  overflow: 'hidden',
  fontFamily: serif,
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '76px',
  lineHeight: 1.2,
  color: fg,
  lineClamp: 3,
} as const

const footerStyle = {
  display: 'flex',
  flexDirection: 'column',
  width: '760px',
} as const

const evergreenStyle = {
  display: 'flex',
  fontFamily: serif,
  fontStyle: 'italic',
  fontSize: '32px',
  lineHeight: 1,
  color: 'rgba(22, 163, 74, 0.8)',
  letterSpacing: '0.04em',
  marginBottom: '14px',
} as const

const metaStyle = {
  display: 'flex',
  alignItems: 'center',
  fontFamily: mono,
  fontSize: '24px',
  lineHeight: 1,
  color: '#85837c',
  letterSpacing: '0.08em',
} as const

const dotStyle = {
  display: 'flex',
  marginLeft: '14px',
  marginRight: '14px',
  opacity: 0.7,
} as const

const bitStyle = { display: 'flex' } as const
</script>

<template>
  <div :style="rootStyle">
    <div
      style="font-style: italic"
      :style="markStyle"
    >
      froQ
    </div>
    <div :style="titleStyle">
      {{ title }}
    </div>
    <div :style="footerStyle">
      <div
        v-if="showEvergreen"
        style="font-style: italic"
        :style="evergreenStyle"
      >
        evergreen
      </div>
      <div
        v-if="meta.length"
        :style="metaStyle"
      >
        <template
          v-for="(bit, index) in meta"
          :key="`${index}-${bit}`"
        >
          <div
            v-if="index"
            :style="dotStyle"
          >
            ·
          </div>
          <div :style="bitStyle">
            {{ bit }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
