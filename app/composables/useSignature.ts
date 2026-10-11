import type { LayerColors, PenAnchors } from '@froq/ui/core'
import type { Ref } from 'vue'
import { usePaperSignature } from '@froq/ui/vue'

export interface SignatureOptions {
  /** The page leaves a margin for the pen; it still needs a `[data-anchor="rule"]`. */
  line?: boolean
}

function readColors(): LayerColors {
  const html = document.documentElement
  const css = getComputedStyle(html)
  const get = (name: string): string => css.getPropertyValue(name).trim()
  return { paper: get('--bg'), ink: get('--fg'), accent: get('--accent'), dark: html.dataset.theme === 'dark' }
}

function mixHex(first: string, weight: number, second: string): string {
  const channel = (hex: string): number[] => {
    const h = hex.replace('#', '')
    return [0, 2, 4].map(index => Number.parseInt(h.slice(index, index + 2), 16))
  }
  const a = channel(first)
  const b = channel(second)
  const mixed = a.map((value, index) => Math.round(value * weight + (b[index] ?? 0) * (1 - weight)))
  return `#${mixed.map(value => value.toString(16).padStart(2, '0')).join('')}`
}

/** Tagline text the pen writes. A placeholder block is not copy. */
function handCopy(el: HTMLElement | null): string {
  if (!el)
    return ''
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.l-fill').forEach(node => node.remove())
  return (clone.textContent ?? '').trim()
}

function sectionsOf(root: HTMLElement): NonNullable<PenAnchors['sections']> {
  return [...root.querySelectorAll<HTMLElement>('.l-section')].flatMap((section) => {
    const label = section.querySelector<HTMLElement>('[data-anchor="label"]')
    if (!label)
      return []
    return [{ element: section, label, price: section.querySelector<HTMLElement>('[data-anchor="price"]') }]
  })
}

/**
 * One sheet of paper under the page, and the pen through it when the page has a margin.
 * Layers are rebuilt per page: a new page is a new sheet.
 *
 * `has-hand` has to land in the same turn the pen measures, because it takes the tagline
 * out of flow. The signature reports that synchronously; a pre-flush watch would be late.
 */
export function useSignature(root: Ref<HTMLElement | undefined>, options: SignatureOptions): void {
  const { product } = useAppConfig()
  const { theme } = useTheme()

  const signature = usePaperSignature(root, {
    settings: () => {
      const sig = product.signature
      const el = root.value
      const ruled = !!sig.line && !!options.line && !!el?.querySelector('[data-anchor="rule"]')
      return {
        paper: sig.paper,
        bloom: sig.bloom,
        line: ruled,
        hand: sig.hand,
        dwellAfter: sig.pointer.dwell === 'wash' ? sig.pointer.dwellAfter : 0,
        click: sig.pointer.click === 'wash',
      }
    },
    anchors: () => {
      const el = root.value
      const find = (anchor: string): HTMLElement | null => el?.querySelector<HTMLElement>(`[data-anchor="${anchor}"]`) ?? null
      const hand = find('tagline')
      const finalMark = find('final-mark')
      return {
        mark: find('mark'),
        hand,
        handText: handCopy(hand),
        rule: find('rule'),
        sections: el ? sectionsOf(el) : [],
        finalMark,
        finalSection: finalMark?.closest('section') ?? null,
        margin: find('label'),
      }
    },
    colors: readColors,
    mixColors: mixHex,
    // Underlines, not rings, and connecting ink stays at full weight, as this page draws it.
    fadeRoute: false,
    labels: 'line',
  })

  watch(
    () => [signature.state.paper, signature.state.bloom, signature.state.stroke, signature.state.hand] as const,
    ([paper, bloom, stroke, hand]) => {
      const html = document.documentElement
      html.classList.toggle('has-paper', paper)
      html.classList.toggle('has-bloom', bloom)
      html.classList.toggle('has-stroke', stroke)
      html.classList.toggle('has-hand', hand)
    },
    { flush: 'sync' },
  )

  watch(theme, async () => {
    await nextTick()
    signature.setColors()
  })

  onBeforeUnmount(() => {
    document.documentElement.classList.remove('has-paper', 'has-bloom', 'has-stroke', 'has-hand')
  })
}
