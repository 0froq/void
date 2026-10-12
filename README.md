# void

A lovingly art-directed product for accomplishing absolutely none of your goals.

- Site: [void.froq.me](https://void.froq.me)
- Stack: Nuxt 4, Nuxt Content, TypeScript, Cloudflare Workers

```bash
pnpm i
pnpm dev
pnpm generate
pnpm deploy
```

Production deploys through Cloudflare Workers Builds: build with `pnpm generate`, then `pnpm exec cf deploy`. The repository does not store a Cloudflare API token.
