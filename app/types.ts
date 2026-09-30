export interface Signature {
  /** WebGL sheet and washes behind the page. The tooth lives on `Paper`. */
  paper: boolean
  /** One pen line threading the page head, the label column and the last full stop. */
  line: boolean
  /** The pen handwrites the hero tagline (Latin only; the font has no CJK glyphs). */
  hand: boolean
  /** Watercolour on punctuation. Needs `paper`. */
  bloom: boolean
  /** Ink the pointer leaves on the paper. `false` is still. `wash` is watercolour. */
  pointer: {
    dwell: false | 'wash'
    click: false | 'wash'
    /** Seconds the pointer must rest before dwell ink starts. */
    dwellAfter: number
  }
}

export interface NavLink {
  /** i18n key, e.g. `nav.docs`. */
  label: string
  /** Locale-free path (`/docs`, `/#pricing`) or an absolute URL. */
  to: string
}

export interface Palette {
  bg: string
  fg: string
  muted: string
  faint: string
  line: string
  accent: string
}

/** Optional overrides for type, scale and grid. Omitted keys keep the stylesheet defaults. */
export interface Skin {
  font?: { display?: string, text?: string, meta?: string }
  /** 1 is the shipped page. Display, poster and title scale their own clamps. */
  scale?: { display?: number, poster?: number, title?: number, section?: number }
  gap?: string
  section?: string
  /** Margin column and body column. They should add up to 12. */
  margin?: number
  body?: number
}

export interface ProductConfig {
  /** Wordmark. Empty renders a placeholder block. */
  name: string
  /** The accent stop after the name. */
  mark: string
  theme: { light: Palette, dark: Palette }
  skin?: Skin
  signature: Signature
  /** Where "Install" goes. `null` plays the vanish instead of navigating. */
  install: { href: string | null }
  nav: NavLink[]
  footer: NavLink[]
}

declare module 'nuxt/schema' {
  interface AppConfigInput {
    product?: Partial<ProductConfig>
  }
  interface AppConfig {
    product: ProductConfig
  }
}

export type Theme = 'light' | 'dark'

export interface Figure {
  value: string
  unit?: string
  label?: string
  copy?: string
}

export interface Quote {
  quote: string
  by?: string
}

export interface Fact {
  label: string
  value: string
}

export interface Question {
  q: string
  a: string
}
