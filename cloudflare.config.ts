import { defineConfig } from 'cf/config'

export default defineConfig({
  worker: {
    name: 'void',
    compatibilityDate: '2026-10-12',
    compatibilityFlags: ['nodejs_compat'],
    observability: {
      enabled: true,
      traces: { enabled: true },
    },
    assets: {
      htmlHandling: 'drop-trailing-slash',
      notFoundHandling: '404-page',
    },
  },
})
