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

While `pnpm dev` is running, the DevTools inspect panel opens the file in a new editor window at that line and column. Cmd+W closes the new window. The default is Zed:

```bash
zed --new path/to/file:line:column
```

`MINI_EDITOR` overrides it. `miniEditor.editor` in `nuxt.config.ts` wins over the env var.

| `MINI_EDITOR` | Command |
| --- | --- |
| `zed` (default) | `zed --new file:line:col` |
| `code` or `vscode` | `code -n -g file:line:col` |
| `cursor` | `cursor -n -g file:line:col` |
| `subl` or `sublime` | `subl -n file:line:col` |

```bash
MINI_EDITOR=cursor pnpm dev
```

After open, dev-only `placeWindow()` resizes and moves that window (default `900x600`, position `right`). Set `MINI_EDITOR_SIZE`, `MINI_EDITOR_POSITION` (`right`, `center`, `mouse`), or `MINI_EDITOR_PLACE=0` to skip. On macOS, grant **Accessibility** to the app running `pnpm dev`. On Linux X11 install `wmctrl` or `xdotool`; on Wayland use Hyprland or Sway tools, or skip. The module registers nothing outside `nuxt dev`. See `tools/mini-editor/README.md` and `findings.md`.

Deploys on Cloudflare Workers (Worker name `void`). `pnpm generate` writes `dist/`. Worker config is in `cloudflare.config.ts`, static assets directory in `wrangler.config.ts`. Local one-shot publish is `pnpm deploy`.

Workers Builds (GitHub connection, no API token in the repo): `NODE_VERSION=22` (22.22.3 or newer), build `pnpm generate`, production `pnpm exec cf deploy`, preview `pnpm exec cf previews deploy`.

Share cards are drawn at generate time by nuxt-og-image (Takumi) via the public [`@froq/og-covers-layer`](https://github.com/0froq/og-layer) Nuxt layer (`extends: github:0froq/og-layer#v0.1.0`). The template is `Paper.takumi.vue`: paper background, serif title, mono meta, froQ mark. Every content entry calls `defineOgImage`. Frontmatter `cover` wins, then `ogImage.url`, then a file dropped at `public/covers/<collection>/<locale>/<slug>.png`. `ogImage: false` skips the image. Nothing under `public/covers` is committed for generated cards; the PNGs land in `dist`.

`og:url` and the canonical link stay on `https://void.froq.me`. `og:image` is an absolute URL on `https://void.sayhola.workers.dev` (`site.url`, and the matching i18n `baseUrl`), because X will not fetch images hosted on froq.me. In dev, the Nuxt DevTools OG Image tab previews the template and hot-reloads it. Takumi is the renderer: it reads woff2 and walks the font subset chain (latin ranges, and the chinese-simplified slice for Han). Satori does not read woff2, and one family name keeps a single slice, so a Han title loses the rest of its glyphs.
