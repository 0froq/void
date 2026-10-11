import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default antfu(
  {
    // Markdown formatters rewrite MDC's `---` prop blocks into setext headings
    ignores: ['content/**', 'README.md', 'vendor/ui/**'],
    pnpm: true,
    typescript: true,
    vue: true,
    rules: {
      'vue/max-attributes-per-line': ['error', {
        singleline: { max: 1 },
        multiline: { max: 1 },
      }],
      'unused-imports/no-unused-imports': 'off',
    },
    formatters: {
      css: true,
      html: true,
      markdown: 'dprint',
    },
  },
)
  .append(nuxt())
