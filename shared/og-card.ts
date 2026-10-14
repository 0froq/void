// Static 1200×630 share card. The face follows IssuePeekCard's front
// (serif title, evergreen label, mono meta) plus the back face's froQ mark.
// Laid out for 1.91:1. No hover, tilt, or flip.

export const OG_CARD_WIDTH = 1200
export const OG_CARD_HEIGHT = 630

/** Tailwind green-600 at 80%, the evergreen mark on the source card. */
export const OG_EVERGREEN = 'rgba(22, 163, 74, 0.8)'

const SERIF = 'Instrument Serif'
const MONO = 'Geist Mono'

export interface OgTheme {
  bg: string
  fg: string
  muted: string
  line: string
}

export interface OgCardInput {
  title: string
  /** `evergreen: true` or `kind: evergreen`. */
  evergreen?: boolean
  /** `created` or `date`. */
  created?: string
  /** `last_modified` or `updated`. Shown only when evergreen and not the same day. */
  updated?: string
  words?: number
  theme: OgTheme
}

export interface OgCardModel {
  title: string
  evergreen: boolean
  meta: string[]
  theme: OgTheme
}

const DATE_RE = /(\d{4})-(\d{2})-(\d{2})/

export function formatCardDate(value?: string): string {
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

export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en', {
    notation: n >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(n)
}

/** CJK ideographs count as one each. Latin words are whitespace-separated. Fenced code is skipped. */
export function countCardWords(markdown: string): number {
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
  const text = body.replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ')
  const cjk = text.match(/[\u3400-\u9FFF]/g)?.length ?? 0
  const words = text
    .replace(/[\u3400-\u9FFF]/g, ' ')
    .split(/[^a-z0-9']+/i)
    .filter(Boolean)
    .length
  return cjk + words
}

export function ogCardModel(input: OgCardInput): OgCardModel {
  const meta: string[] = []
  const created = formatCardDate(input.created)
  if (created)
    meta.push(created)
  if (input.evergreen) {
    const updated = formatCardDate(input.updated)
    const sameDay = dateStamp(input.updated) !== '' && dateStamp(input.updated) === dateStamp(input.created)
    if (updated && !sameDay)
      meta.push(updated)
  }
  if (input.words && input.words > 0)
    meta.push(`${formatCompact(input.words)} words`)
  return {
    title: input.title.trim(),
    evergreen: Boolean(input.evergreen),
    meta,
    theme: input.theme,
  }
}

interface Node {
  type: string
  props: {
    style?: Record<string, string | number>
    children?: string | Node | Array<string | Node>
  }
}

function node(type: string, style: Record<string, string | number>, children?: Node['props']['children']): Node {
  return { type, props: { style, children } }
}

/** Satori tree for one card. Colors are the light paper tokens. Title is `--ui-fg`. */
export function ogCardNode(model: OgCardModel): Node {
  const markColor = withAlpha(model.theme.fg, 0.11)
  const footer: Node[] = []
  if (model.evergreen) {
    footer.push(node('div', {
      display: 'flex',
      fontFamily: SERIF,
      fontStyle: 'italic',
      fontSize: 32,
      lineHeight: 1,
      color: OG_EVERGREEN,
      letterSpacing: '0.04em',
      marginBottom: 14,
    }, 'evergreen'))
  }
  if (model.meta.length) {
    const bits: Node[] = []
    model.meta.forEach((bit, index) => {
      if (index) {
        bits.push(node('div', {
          display: 'flex',
          marginLeft: 14,
          marginRight: 14,
          opacity: 0.7,
        }, '·'))
      }
      bits.push(node('div', { display: 'flex' }, bit))
    })
    footer.push(node('div', {
      display: 'flex',
      alignItems: 'center',
      fontFamily: MONO,
      fontSize: 24,
      lineHeight: 1,
      color: model.theme.muted,
      letterSpacing: '0.08em',
    }, bits))
  }

  const tree = node('div', {
    width: OG_CARD_WIDTH,
    height: OG_CARD_HEIGHT,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: model.theme.bg,
    border: `2px solid ${model.theme.line}`,
    boxSizing: 'border-box',
    padding: '72px 80px 64px',
    position: 'relative',
    overflow: 'hidden',
  }, [
    node('div', {
      position: 'absolute',
      right: 56,
      bottom: 40,
      display: 'flex',
      fontFamily: SERIF,
      fontStyle: 'italic',
      fontWeight: 400,
      fontSize: 200,
      lineHeight: 1,
      letterSpacing: '-0.04em',
      color: markColor,
    }, 'froQ'),
    node('div', {
      display: 'block',
      width: 760,
      overflow: 'hidden',
      fontFamily: SERIF,
      fontStyle: 'normal',
      fontWeight: 400,
      fontSize: 76,
      lineHeight: 1.2,
      color: model.theme.fg,
      lineClamp: 3,
    }, model.title),
    node('div', {
      display: 'flex',
      flexDirection: 'column',
      width: 760,
    }, footer),
  ])
  return tree
}

export function withAlpha(color: string, alpha: number): string {
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color.trim())
  if (!match?.[1])
    return color
  const hex = match[1].length === 3
    ? match[1].split('').map(channel => channel + channel).join('')
    : match[1]
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
