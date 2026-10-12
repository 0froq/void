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

Workers Builds (GitHub connection, no API token in the repo): `NODE_VERSION=22`, build `pnpm generate`, production `pnpm exec cf deploy`, preview `pnpm exec cf previews deploy`.
