# @froq/og-covers-layer

Self-contained Nuxt layer for **nuxt-og-image v7** share cards (Takumi renderer).

## Use

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['./layers/og-covers'],
  site: {
    url: 'https://your-worker.workers.dev', // absolute `og:image` origin
    name: 'your-site',
  },
  devtools: { enabled: true }, // OG Image tab in DevTools
})
```

Install the layer package (or point `extends` at this folder) and add its dependencies via your workspace.

## Site-specific values

Configure in the host app:

| Setting            | Where                                | Purpose                                                  |
| ------------------ | ------------------------------------ | -------------------------------------------------------- |
| Share image origin | `site.url` (Nuxt Site Config)        | Absolute `og:image` / `twitter:image` host               |
| i18n `baseUrl`     | `i18n.baseUrl`                       | Match `site.url` when using `@nuxtjs/i18n`               |
| Canonical origin   | host `useShareMeta` / `canonicalUrl` | `og:url` (often a different domain than images)          |
| Watermark text     | `app.config` → `ogCovers.mark`       | Bottom-right mark (default `froQ`)                       |
| Card colors        | `app.config` → `ogCovers.colors`     | Paper card palette (defaults match froQ void)            |
| Public share files | `runtimeConfig.public.publicFiles`   | List of image paths under `public/` for cover precedence |

## Cover precedence

For each content entry:

1. Frontmatter `cover` (https URL or existing `public/` path)
2. Frontmatter `ogImage.url`
3. `public/covers/<collection>/<locale>/<slug>.png` when present
4. Generated card via `defineOgImage` (`Paper.takumi.vue`)

`ogImage: false` skips the generated image.

## Content pages

Auto-imported helpers from this layer:

- `contentOgOverride`, `explicitContentCover`, `paperFields`, `ogComponentName`, `ogExtraProps`
- `countCardWords` — import `@froq/og-covers-layer/card-words` in `nuxt.config` hooks

## Fonts

The layer registers Instrument Serif (title), Noto Serif SC (Han), Geist Mono (meta), and EB Garamond italic 400 (watermark). The OFL notice for EB Garamond ships in `public/fonts/EB-Garamond-OFL.txt`.

## Moving to a standalone repo

This directory has no imports outside itself. Publish as an npm package and set `extends: ['@froq/og-covers-layer']`.
