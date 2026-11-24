import type { ProductConfig } from './types'

export default defineAppConfig({
  product: {
    name: 'void',
    mark: '.',
    theme: {
      light: {
        bg: '#f4f2ec',
        fg: '#1a1917',
        muted: '#85837c',
        faint: '#cfccc3',
        line: 'rgba(26, 25, 23, 0.12)',
        accent: '#e8431f',
      },
      dark: {
        bg: '#111113',
        fg: '#f2f0ea',
        muted: '#918f88',
        faint: '#32312d',
        line: 'rgba(242, 240, 234, 0.1)',
        accent: '#ff6242',
      },
    },
    signature: {
      paper: true,
      line: true,
      hand: true,
      bloom: true,
      pointer: { dwell: 'wash', click: 'wash', dwellAfter: 1.2 },
    },
    install: { href: null },
    nav: [
      { label: 'nav.docs', to: '/docs' },
      { label: 'nav.notes', to: '/notes' },
      { label: 'nav.changelog', to: '/changelog' },
    ],
    footer: [
      { label: 'nav.install', to: '/install' },
      { label: 'nav.docs', to: '/docs' },
      { label: 'nav.notes', to: '/notes' },
      { label: 'nav.changelog', to: '/changelog' },
    ],
  } satisfies ProductConfig,
})
