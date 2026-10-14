import type { OgTheme } from '../shared/og-card'
import { defineNuxtModule } from 'nuxt/kit'
import { collectContentRoutes, generateOgCovers } from '../shared/og-covers'
import { listPublicShareImages } from '../shared/public-files'

interface ShareProduct {
  name?: string
  share?: { title?: string, image?: string }
  theme?: { light?: Partial<OgTheme> }
}

/** Light paper tokens. Same values as `--ui-bg` `--ui-fg` `--ui-muted` `--ui-line`. */
const PAPER: OgTheme = {
  bg: '#f4f2ec',
  fg: '#1a1917',
  muted: '#85837c',
  line: 'rgba(26, 25, 23, 0.12)',
}

/**
 * Writes a 1200×630 card for every content page into `public/covers/_card/`
 * before the static build, then registers those files so share meta can find them.
 * The Worker only serves the PNGs.
 */
export default defineNuxtModule({
  meta: { name: 'og-covers' },
  setup(_options, nuxt) {
    nuxt.hook('build:before', async () => {
      const product = nuxt.options.appConfig.product as ShareProduct | undefined
      const light = product?.theme?.light
      const theme: OgTheme = {
        bg: light?.bg || PAPER.bg,
        fg: light?.fg || PAPER.fg,
        muted: light?.muted || PAPER.muted,
        line: light?.line || PAPER.line,
      }
      const paths = await generateOgCovers({
        rootDir: nuxt.options.rootDir,
        fallbackTitle: fallbackTitle(product),
        theme,
      })
      nuxt.options.runtimeConfig.public.publicFiles = listPublicShareImages()
      // One line so a generate log shows the cards were written.
      // eslint-disable-next-line no-console
      console.info(`og covers: ${paths.length} cards`)
    })

    // Crawl only follows links. Unlinked pages (install while href is null) still
    // need HTML so the static file carries the absolute card URL.
    nuxt.hook('nitro:init', (nitro) => {
      nitro.hooks.hook('prerender:routes', async (routes: Set<string>) => {
        const extra = await collectContentRoutes(nuxt.options.rootDir, defaultLocale(nuxt))
        for (const route of extra)
          routes.add(route)
      })
    })
  },
})

function defaultLocale(nuxt: { options: { i18n?: { defaultLocale?: string } } }): string {
  return nuxt.options.i18n?.defaultLocale || 'en'
}

function fallbackTitle(product: ShareProduct | undefined): string {
  const title = product?.share?.title?.trim()
  if (title)
    return title
  const name = product?.name?.trim()
  if (name)
    return name
  return 'void'
}
