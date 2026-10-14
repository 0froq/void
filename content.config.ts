import { defineCollection, defineContentConfig, z } from '@nuxt/content'
import { defineOgImageSchema } from 'nuxt-og-image/content'

// Every file lives under a locale folder (`en/`, `zh/`), so paths start with `/en`, `/zh`.
// Optional frontmatter `cover`: a `public/` path or an absolute https URL. It wins over `ogImage.url`.
// `ogImage: false` turns the card off. `ogImage.component` / `props` override the paper card.
// `evergreen` (or `kind: evergreen`) draws the green label on the card.
// `date` / `created` is the created date. `updated` / `last_modified` shows only when evergreen.
// `words` is filled at parse time for the card; it is not frontmatter.
const card = {
  cover: z.string().optional(),
  ogImage: defineOgImageSchema({ z }),
  words: z.number().optional(),
  evergreen: z.boolean().optional(),
  kind: z.string().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
  last_modified: z.string().optional(),
}

export default defineContentConfig({
  collections: {
    // Free-form pages built from MDC blocks: the landing (`index.md`), install, anything else
    pages: defineCollection({
      type: 'page',
      source: {
        include: '*/**/*.md',
        exclude: ['*/notes/**', '*/changelog/**', '*/docs/**'],
      },
      schema: z.object({
        kicker: z.string().optional(),
        // Page head with a big title and ruled lede; the landing turns it off and uses `::hero`
        head: z.boolean().default(true),
        // Whether the pen runs through this page
        line: z.boolean().default(true),
        date: z.string().optional(),
        ...card,
      }),
    }),
    notes: defineCollection({
      type: 'page',
      source: '*/notes/*.md',
      schema: z.object({
        date: z.string(),
        ...card,
      }),
    }),
    changelog: defineCollection({
      type: 'page',
      source: '*/changelog/*.md',
      schema: z.object({
        version: z.string(),
        date: z.string(),
        ...card,
      }),
    }),
    // Numeric prefixes (`1.install.md`) order the sidebar and are dropped from the path
    docs: defineCollection({
      type: 'page',
      source: '*/docs/**/*.md',
      schema: z.object({
        date: z.string().optional(),
        ...card,
      }),
    }),
  },
})
