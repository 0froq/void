# void

A lovingly art-directed product for accomplishing absolutely none of your goals.

- Site: [void.froq.me](https://void.froq.me)
- Stack: Nuxt 4, Nuxt Content, TypeScript, Cloudflare Workers

```bash
pnpm i
pnpm dev
pnpm generate
pnpm deploy
pnpm preview:deploy
```

Deploys on Cloudflare Workers (Worker name `void`). `pnpm generate` writes `dist/`. Worker config is in `cloudflare.config.ts`, static assets directory in `wrangler.config.ts`. Local one-shot publish is `pnpm deploy`.

Workers Builds (GitHub connection, no API token in the repo): `NODE_VERSION=22` (22.22.3 or newer), build `pnpm generate`, production `pnpm exec cf deploy`, preview `pnpm exec cf previews deploy`.

Share cards are drawn at generate time by nuxt-og-image (Takumi) via the `@froq/og-covers-layer` Nuxt layer (`layers/og-covers`). The template is `Paper.takumi.vue`: paper background, serif title, mono meta, froQ mark. Every content entry calls `defineOgImage`. Frontmatter `cover` wins, then `ogImage.url`, then a file dropped at `public/covers/<collection>/<locale>/<slug>.png`. `ogImage: false` skips the image. Nothing under `public/covers` is committed for generated cards; the PNGs land in `dist`.

`og:url` and the canonical link stay on `https://void.froq.me`. `og:image` is an absolute URL on `https://void.sayhola.workers.dev` (`site.url`, and the matching i18n `baseUrl`), because X will not fetch images hosted on froq.me. In dev, the Nuxt DevTools OG Image tab previews the template and hot-reloads it. Takumi is the renderer: it reads woff2 and walks the font subset chain (latin ranges, and the chinese-simplified slice for Han). Satori does not read woff2, and one family name keeps a single slice, so a Han title loses the rest of its glyphs.
