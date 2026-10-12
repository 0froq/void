import { keepEmptyTitle } from './shared/empty-title'
import { markFinalStop } from './shared/final-mark'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-19',

  hooks: {
    // Notes and docs have no `::final`; the stop that ends the text blooms instead.
    // An explicit `title: ''` must stay empty: Content otherwise names the page after the file.
    'content:file:afterParse': ({ file, content, collection }) => {
      keepEmptyTitle(content, file.body)
      if (collection.name === 'notes' || collection.name === 'docs')
        markFinalStop(content.body)
    },
  },

  build: { transpile: ['@froq/ui'] },

  modules: [
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxt/eslint',
  ],

  css: [
    '@fontsource-variable/geist/index.css',
    '@fontsource-variable/geist-mono/index.css',
    '@fontsource/instrument-serif/400.css',
    '@fontsource/instrument-serif/400-italic.css',
    '~/assets/css/kit.css',
    '@froq/ui/style.css',
  ],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
      meta: [{ name: 'color-scheme', content: 'light dark' }],
      script: [{
        tagPosition: 'head',
        innerHTML: `try{var t=localStorage.getItem('kit-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}`,
      }],
    },
  },

  content: {
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        highlight: {
          theme: { default: 'vitesse-light', dark: 'vitesse-dark' },
          langs: ['ts', 'js', 'vue', 'bash', 'json', 'yaml', 'md'],
        },
      },
    },
  },

  i18n: {
    locales: [
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'zh', language: 'zh-CN', name: '中文', file: 'zh.json' },
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
  },

  nitro: {
    output: {
      publicDir: 'dist',
    },
    prerender: {
      crawlLinks: true,
      routes: ['/', '/zh'],
    },
  },

  typescript: { strict: true },

  eslint: { config: { standalone: false } },
})
