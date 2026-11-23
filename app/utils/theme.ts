import type { Palette } from '~/types'

const KEYS = ['bg', 'fg', 'muted', 'faint', 'line', 'accent'] as const

function decl(palette: Palette, scheme: 'light' | 'dark'): string {
  const colors = KEYS.map(key => `--${key}: ${palette[key]}`).join('; ')
  return `${colors}; color-scheme: ${scheme}`
}

/** Light and dark palettes. `html:root` beats the stylesheet so these win. */
export function themeStyle(theme: { light: Palette; dark: Palette }): string {
  const dark = decl(theme.dark, 'dark')
  return `html:root{${decl(theme.light, 'light')}}html:root[data-theme=dark]{${dark}}@media (prefers-color-scheme: dark){html:root:not([data-theme]){${dark}}}`
}
