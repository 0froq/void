import { liangmi } from '@liangmi/vp-config'

// Vite+ loads lint and fmt from this file via `-c vp.config.ts` (see
// package.json scripts). Nuxt owns application Vite via `nuxt.config.ts`; the
// file is NOT named vite.config.* so Nuxt's B5004 external-config warning does
// not fire.
const siteLintIgnores = [
  'vendor/**',
  'content/**',
  'public/**',
  '.nuxt/**',
  '.output/**',
  '.data/**',
  '.agents/**',
  'dist/**',
  '**/generated/**',
]

const siteFmtIgnores = [
  ...siteLintIgnores,
  'AGENTS.md',
  // ESLint already skipped this file. Oxfmt rewrites its tables and prose.
  'README.md',
  'pnpm-lock.yaml',
  'skills-lock.json',
  // Deploy config stays as it is on main.
  'cloudflare.config.ts',
  'wrangler.config.ts',
]

export default liangmi({
  lint: [
    {
      name: 'froq/ignores',
      ignores: siteLintIgnores,
    },
    {
      // Preset rules that do not match this Nuxt site's existing source.
      // Keep the PR on the toolchain; do not rewrite application code to the
      // style/restriction allowlist in one step.
      name: 'froq/compat',
      rules: {
        'eqeqeq': 'off',
        'eslint/class-methods-use-this': 'off',
        'eslint/default-case': 'off',
        'eslint/max-classes-per-file': 'off',
        'eslint/no-param-reassign': 'off',
        'eslint/no-promise-executor-return': 'off',
        'import/extensions': 'off',
        'import/no-cycle': 'off',
        'import/no-default-export': 'off',
        'import/no-unassigned-import': 'off',
        'no-array-for-each': 'off',
        'no-negated-condition': 'off',
        'no-underscore-dangle': 'off',
        'no-useless-assignment': 'off',
        'node/no-sync': 'off',
        'oxc/approx-constant': 'off',
        'oxc/no-map-spread': 'off',
        'prefer-import-meta-properties': 'off',
        'promise/always-return': 'off',
        'promise/no-callback-in-promise': 'off',
        'unicorn/consistent-function-scoping': 'off',
        'unicorn/explicit-length-check': 'off',
        'unicorn/no-array-reduce': 'off',
        'unicorn/no-array-reverse': 'off',
        'unicorn/no-array-sort': 'off',
        'unicorn/no-useless-undefined': 'off',
        'unicorn/prefer-array-find': 'off',
        'unicorn/prefer-array-some': 'off',
        'unicorn/prefer-code-point': 'off',
        'unicorn/prefer-dom-node-append': 'off',
        'unicorn/prefer-dom-node-dataset': 'off',
        'unicorn/prefer-query-selector': 'off',
        'unicorn/prefer-string-replace-all': 'off',
      },
    },
    {
      name: 'froq/scripts',
      files: ['**/scripts/**'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  fmt: {
    quoteProps: 'consistent',
    singleAttributePerLine: true,
    htmlWhitespaceSensitivity: 'strict',
    trailingComma: 'all',
    sortImports: false,
    sortPackageJson: false,
    ignorePatterns: siteFmtIgnores,
    // The display font-size calc is past the default print width, and the font
    // stacks sit just past 100. Keep those declarations on the lines this
    // sheet already uses.
    overrides: [
      {
        files: ['app/assets/css/kit.css'],
        options: { printWidth: 120 },
      },
    ],
  },
})
  .exclude(['pack', 'test', 'staged'])
  .option([
    {
      path: '.',
      node: true,
      browser: true,
      vue: true,
      react: false,
    },
  ])
  .remove('liangmi/style')
  .override('liangmi/options', {
    options: {
      typeAware: false,
      typeCheck: false,
    },
  })
